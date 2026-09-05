import { User } from "../models/User.js";
import {
  authenticate,
  hashPassword,
  issueSession,
  revokeAllSessions,
  revokeSessionByToken,
  rotateSession,
  verifyPassword,
} from "../services/authService.js";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/emailService.js";
import { createOpaqueToken, hashToken, refreshTokenTtlMs } from "../services/tokenService.js";
import { AppError, asyncHandler } from "../utils/errors.js";

const REFRESH_COOKIE = "ghalib_refresh";
const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

// Scoped to /api/auth so the cookie never rides along on menu, cart or order calls.
function cookieOptions() {
  const sameSite = (process.env.COOKIE_SAMESITE || "lax").toLowerCase();
  return {
    httpOnly: true,
    sameSite,
    secure: sameSite === "none" || process.env.NODE_ENV === "production",
    path: "/api/auth",
  };
}

const setRefreshCookie = (res, token) => res.cookie(REFRESH_COOKIE, token, { ...cookieOptions(), maxAge: refreshTokenTtlMs() });
const clearRefreshCookie = (res) => res.clearCookie(REFRESH_COOKIE, cookieOptions());

function respondWithSession(res, session, { status = 200, message } = {}) {
  setRefreshCookie(res, session.refreshToken);
  res.status(status).json({ ...(message ? { message } : {}), accessToken: session.accessToken, user: session.user.toJSON() });
}

async function issueEmailVerification(user, next) {
  const token = createOpaqueToken();
  await User.updateOne({ _id: user._id }, {
    $set: { emailVerificationTokenHash: hashToken(token), emailVerificationExpires: new Date(Date.now() + VERIFICATION_TTL_MS) },
  });
  await sendVerificationEmail(user, token, next);
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.exists({ email })) throw new AppError("An account with that email already exists", 409);
  // role is never read from the request: public signup can only ever create a customer.
  const user = await User.create({ name, email, passwordHash: await hashPassword(password), role: "customer" });
  respondWithSession(res, await issueSession(user, req.get("user-agent")), {
    status: 201,
    message: "Account created successfully.",
  });
});

export const login = asyncHandler(async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password);
  respondWithSession(res, await issueSession(user, req.get("user-agent")));
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    respondWithSession(res, await rotateSession(req.cookies?.[REFRESH_COOKIE], req.get("user-agent")));
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await revokeSessionByToken(req.cookies?.[REFRESH_COOKIE]);
  clearRefreshCookie(res);
  res.json({ message: "Signed out" });
});

export const logoutAll = asyncHandler(async (req, res) => {
  await revokeAllSessions(req.user._id);
  clearRefreshCookie(res);
  res.json({ message: "Signed out of every device" });
});

export const getMe = asyncHandler(async (req, res) => res.json({ data: req.user.toJSON() }));

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { name: req.body.name }, { new: true, runValidators: true });
  res.json({ message: "Profile updated", data: user.toJSON() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("+passwordHash");
  if (!user || !(await verifyPassword(req.body.currentPassword, user.passwordHash))) {
    throw new AppError("Your current password is incorrect", 400);
  }
  await User.updateOne({ _id: user._id }, {
    $set: { passwordHash: await hashPassword(req.body.newPassword) },
    $unset: { passwordResetTokenHash: "", passwordResetExpires: "" },
  });
  await revokeAllSessions(user._id);
  respondWithSession(res, await issueSession(user, req.get("user-agent")), { message: "Password updated" });
});

export const verifyEmail = asyncHandler(async (req, res) => {
  const token = req.body?.token || req.valid?.token;
  if (!token) throw new AppError("Verification token is required", 400);
  const user = await User.findOne({
    emailVerificationTokenHash: hashToken(token),
    emailVerificationExpires: { $gt: new Date() },
  });
  if (!user) {
    if (req.user?.isEmailVerified) {
      return res.json({ message: "Email is already verified. You can place orders now." });
    }
    throw new AppError("This verification link is invalid or has expired", 400);
  }
  await User.updateOne({ _id: user._id }, {
    $set: { isEmailVerified: true },
    $unset: { emailVerificationTokenHash: "", emailVerificationExpires: "" },
  });
  res.json({ message: "Email verified. You can place orders now." });
});

export const resendVerification = asyncHandler(async (req, res) => {
  if (req.user.isEmailVerified) throw new AppError("Your email address is already verified", 400);
  await issueEmailVerification(req.user, req.body?.next);
  res.json({ message: "Verification email sent." });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (user) {
    const token = createOpaqueToken();
    await User.updateOne({ _id: user._id }, {
      $set: { passwordResetTokenHash: hashToken(token), passwordResetExpires: new Date(Date.now() + RESET_TTL_MS) },
    });
    await sendPasswordResetEmail(user, token);
  }
  // Identical response either way so the endpoint cannot be used to discover accounts.
  res.json({ message: "If that email is registered, a reset link is on its way." });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(req.body.token),
    passwordResetExpires: { $gt: new Date() },
  });
  if (!user) throw new AppError("This reset link is invalid or has expired", 400);
  await User.updateOne({ _id: user._id }, {
    $set: { passwordHash: await hashPassword(req.body.password), failedLoginAttempts: 0 },
    $unset: { passwordResetTokenHash: "", passwordResetExpires: "", lockUntil: "" },
  });
  await revokeAllSessions(user._id);
  clearRefreshCookie(res);
  res.json({ message: "Password updated. Sign in with your new password." });
});
