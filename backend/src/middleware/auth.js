import { User } from "../models/User.js";
import { verifyAccessToken } from "../services/tokenService.js";
import { AppError, asyncHandler } from "../utils/errors.js";

function readBearer(req) {
  const header = req.get("authorization") || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

// The user is reloaded on every request so role changes and deletions take effect
// immediately instead of waiting for the access token to expire.
async function resolveUser(token) {
  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return null;
  }
  return User.findById(payload.sub);
}

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const token = readBearer(req);
  if (!token) throw new AppError("Sign in to continue", 401);
  const user = await resolveUser(token);
  if (!user) throw new AppError("Your session has expired. Please sign in again.", 401);
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = readBearer(req);
  if (token) req.user = (await resolveUser(token)) || undefined;
  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new AppError("Sign in to continue", 401));
  if (!roles.includes(req.user.role)) return next(new AppError("You do not have access to this action", 403));
  next();
};

export const requireVerifiedEmail = (req, _res, next) => {
  if (!req.user) return next(new AppError("Sign in to continue", 401));
  if (!req.user.isEmailVerified) return next(new AppError("Verify your email address before placing an order", 403));
  next();
};
