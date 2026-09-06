import mongoose from "mongoose";

export const RESERVATION_STATUSES = ["pending", "confirmed", "cancelled", "completed"];

// Only valid admin moves. Anything outside this table is rejected.
export const RESERVATION_TRANSITIONS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const reservationSchema = new mongoose.Schema({
  reservationNumber: { type: String, required: true, unique: true, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, trim: true, lowercase: true, maxlength: 160 },
  phone: { type: String, required: true, trim: true, maxlength: 30 },
  phoneKey: { type: String, required: true, index: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1, max: 12 },
  specialRequests: { type: String, trim: true, maxlength: 300, default: "" },
  policyAccepted: { type: Boolean, required: true, default: false },
  status: { type: String, enum: RESERVATION_STATUSES, default: "pending", index: true },
}, { timestamps: true });

reservationSchema.index({ date: 1, time: 1, status: 1 });
reservationSchema.index(
  { phoneKey: 1, date: 1, time: 1 },
  { unique: true, partialFilterExpression: { phoneKey: { $type: "string" }, status: { $in: ["pending", "confirmed"] } } },
);
export const Reservation = mongoose.model("Reservation", reservationSchema);

