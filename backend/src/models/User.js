import mongoose from "mongoose";

// Never leaves the server: stripped from every serialised user.
const PRIVATE_FIELDS = [
  "passwordHash",
  "emailVerificationTokenHash",
  "emailVerificationExpires",
  "passwordResetTokenHash",
  "passwordResetExpires",
  "failedLoginAttempts",
  "lockUntil",
];

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 80 },
  email: { type: String, required: [true, "Email is required"], trim: true, lowercase: true, unique: true, maxlength: 160 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["customer", "admin"], default: "customer", index: true },
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String, select: false },
  emailVerificationExpires: { type: Date, select: false },
  passwordResetTokenHash: { type: String, select: false },
  passwordResetExpires: { type: Date, select: false },
  failedLoginAttempts: { type: Number, default: 0, select: false },
  lockUntil: { type: Date, select: false },
}, { timestamps: true });

userSchema.set("toJSON", {
  transform: (_doc, ret) => {
    for (const field of PRIVATE_FIELDS) delete ret[field];
    delete ret.__v;
    return ret;
  },
});

userSchema.methods.isLocked = function isLocked() {
  return Boolean(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

export const User = mongoose.model("User", userSchema);
