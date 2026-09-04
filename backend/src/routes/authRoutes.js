import { Router } from "express";
import { z } from "zod";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  logoutAll,
  refresh,
  register,
  resendVerification,
  resetPassword,
  updateMe,
  verifyEmail,
} from "../controllers/authController.js";
import { optionalAuth, requireAuth } from "../middleware/auth.js";
import { credentialLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";

// zod trims and lowercases before the format check, then strips unknown keys - so a
// body carrying "role":"admin" never reaches the controller.
const email = z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address"));
const password = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((value) => /[a-zA-Z]/.test(value) && /\d/.test(value), "Password must include a letter and a number");
const name = z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name must be at most 80 characters");
const opaqueToken = z.string().trim().regex(/^[a-f0-9]{64}$/i, "That link is not valid");

const registerSchema = z.object({ name, email, password });
const loginSchema = z.object({ email, password: z.string().min(1, "Password is required") });
const profileSchema = z.object({ name });
const changePasswordSchema = z.object({ currentPassword: z.string().min(1, "Enter your current password"), newPassword: password });
const forgotSchema = z.object({ email });
const resetSchema = z.object({ token: opaqueToken, password });
const verifySchema = z.object({ token: opaqueToken });
const resendSchema = z.object({
  next: z.string().trim().refine((val) => !val || (val.startsWith("/") && !val.startsWith("//")), "Invalid redirect path").optional(),
}).optional();

export const authRouter = Router();
authRouter.post("/register", credentialLimiter, validate(registerSchema), register);
authRouter.post("/login", credentialLimiter, validate(loginSchema), login);
authRouter.post("/forgot-password", credentialLimiter, validate(forgotSchema), forgotPassword);
authRouter.post("/reset-password", credentialLimiter, validate(resetSchema), resetPassword);
authRouter.post("/verify-email", credentialLimiter, optionalAuth, validate(verifySchema), verifyEmail);

authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);

authRouter.use(requireAuth);
authRouter.get("/me", getMe);
authRouter.patch("/me", validate(profileSchema), updateMe);
authRouter.post("/logout-all", logoutAll);
authRouter.post("/change-password", credentialLimiter, validate(changePasswordSchema), changePassword);
authRouter.post("/resend-verification", credentialLimiter, validate(resendSchema), resendVerification);
