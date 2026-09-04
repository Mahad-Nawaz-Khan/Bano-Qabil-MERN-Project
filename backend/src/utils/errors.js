import mongoose from "mongoose";

export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export function requireId(id) {
  if (!mongoose.isValidObjectId(id)) throw new AppError("Invalid resource id", 400);
}
