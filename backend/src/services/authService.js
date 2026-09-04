import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { RefreshToken } from "../models/RefreshToken.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { createOpaqueToken, hashToken, refreshTokenTtlMs, signAccessToken } from "./tokenService.js";

const BCRYPT_ROUNDS = 10;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;
const INVALID_CREDENTIALS = "Email or password is incorrect";
const SESSION_EXPIRED = "Your session has expired. Please sign in again.";

let dummyHash;
// Compared against when the email is unknown so both branches cost the same time.
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("ghalib-timing-equaliser", BCRYPT_ROUNDS));

export const hashPassword = (password) => bcrypt.hash(password, BCRYPT_ROUNDS);

export const verifyPassword = (password, hash) => bcrypt.compare(password, hash || getDummyHash());

export async function authenticate(email, password) {
  const user = await User.findOne({ email }).select("+passwordHash +failedLoginAttempts +lockUntil");
  if (user?.isLocked()) {
    const minutes = Math.max(1, Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000));
    throw new AppError(`Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`, 423);
  }
  const matches = await bcrypt.compare(password, user?.passwordHash || getDummyHash());
  if (!user || !matches) {
    if (user) await registerFailedAttempt(user);
    throw new AppError(INVALID_CREDENTIALS, 401);
  }
  if (user.failedLoginAttempts) await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0 }, $unset: { lockUntil: "" } });
  return user;
}

async function registerFailedAttempt(user) {
  const attempts = (user.failedLoginAttempts || 0) + 1;
  if (attempts < MAX_FAILED_LOGINS) return User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: attempts } });
  return User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lockUntil: new Date(Date.now() + LOCK_MINUTES * 60000) } });
}

async function createRefreshToken(user, family, userAgent, { token = createOpaqueToken(), expiresAt = new Date(Date.now() + refreshTokenTtlMs()), pending = false } = {}) {
  await RefreshToken.create({
    user: user._id,
    tokenHash: hashToken(token),
    family,
    expiresAt,
    pending,
    revokedAt: pending ? new Date() : null,
    userAgent: (userAgent || "").slice(0, 300),
  });
  return { token, expiresAt };
}

export async function issueSession(user, userAgent) {
  const { token, expiresAt } = await createRefreshToken(user, crypto.randomUUID(), userAgent);
  return { accessToken: signAccessToken(user), refreshToken: token, refreshExpiresAt: expiresAt, user };
}

export async function rotateSession(rawToken, userAgent) {
  if (!rawToken) throw new AppError(SESSION_EXPIRED, 401);

  const now = new Date();
  const presentedHash = hashToken(rawToken);
  const stored = await RefreshToken.findOne({ tokenHash: presentedHash });
  if (!stored) throw new AppError(SESSION_EXPIRED, 401);
  if (stored.revokedAt || stored.pending || stored.expiresAt.getTime() <= now.getTime()) {
    await revokeFamily(stored.family);
    throw new AppError(SESSION_EXPIRED, 401);
  }

  const user = await User.findById(stored.user);
  if (!user) {
    await revokeFamily(stored.family);
    throw new AppError(SESSION_EXPIRED, 401);
  }

  const token = createOpaqueToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(now.getTime() + refreshTokenTtlMs());
  const successor = await RefreshToken.create({
    user: user._id,
    tokenHash,
    family: stored.family,
    expiresAt,
    pending: true,
    revokedAt: now,
    userAgent: (userAgent || "").slice(0, 300),
  });

  // A single conditional update claims this exact token. The successor is pending until
  // the claim completes, so a replay cannot race in and leave an active sibling branch.
  const claimed = await RefreshToken.findOneAndUpdate(
    { _id: stored._id, tokenHash: presentedHash, revokedAt: null, pending: { $ne: true }, expiresAt: { $gt: now } },
    { $set: { revokedAt: now, replacedBy: tokenHash } },
    { new: true },
  );
  if (!claimed) {
    // Losing the claim means a sibling request rotated this same token between our read and
    // our write. That is concurrency, not replay: a real replay presents an already-rotated
    // token and is caught by the revokedAt/pending check above. Revoking the family here
    // would also strip `pending` from the winner's successor and log the user out everywhere,
    // so only this request fails. Drop our orphaned successor so it cannot linger.
    await RefreshToken.deleteOne({ _id: successor._id, pending: true });
    throw new AppError(SESSION_EXPIRED, 401);
  }

  const activated = await RefreshToken.updateOne(
    { _id: successor._id, pending: true },
    { $set: { pending: false, revokedAt: null } },
  );
  if (activated.modifiedCount !== 1) {
    await revokeFamily(stored.family);
    throw new AppError(SESSION_EXPIRED, 401);
  }

  return { accessToken: signAccessToken(user), refreshToken: token, refreshExpiresAt: expiresAt, user };
}

export const revokeFamily = (family) => RefreshToken.updateMany(
  { family },
  { $set: { revokedAt: new Date(), pending: false } },
);

export const revokeAllSessions = (userId) => RefreshToken.updateMany(
  { user: userId },
  { $set: { revokedAt: new Date(), pending: false } },
);

export async function revokeSessionByToken(rawToken) {
  if (!rawToken) return;
  const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) });
  if (stored) await revokeFamily(stored.family);
}
