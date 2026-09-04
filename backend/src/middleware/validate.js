import { AppError } from "../utils/errors.js";

// Express 5 exposes req.query through a getter only, so parsed values land on req.valid.
export const validate = (schema, source = "body") => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const message = result.error.issues.map((issue) => issue.message).join(". ");
    return next(new AppError(message || "That request could not be processed", 400));
  }
  req.valid = result.data;
  if (source === "body") req.body = result.data;
  next();
};
