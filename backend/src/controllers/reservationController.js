import { Reservation } from "../models/Reservation.js";
import { sendReservationConfirmationEmail } from "../services/emailService.js";
import { AppError, asyncHandler, requireId } from "../utils/errors.js";

const activeStatuses = ["pending", "confirmed"];
const phoneKey = (phone) => phone.replace(/\D/g, "");
const reservationNumber = () => `RES-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

export const createReservation = asyncHandler(async (req, res) => {
  const { date, time, phone } = req.body;
  const normalizedPhone = phoneKey(phone);
  const [duplicate, count] = await Promise.all([
    Reservation.exists({ phoneKey: normalizedPhone, date, time, status: { $in: activeStatuses } }),
    Reservation.countDocuments({ date, time, status: { $in: activeStatuses } }),
  ]);
  if (normalizedPhone.length < 7) throw new AppError("Please provide a valid phone number", 400);
  if (duplicate) throw new AppError("This phone number already has an active reservation for this time slot", 409);
  if (count >= 5) throw new AppError("This time slot is fully booked. Please choose another time.", 409);
  let reservation;
  try {
    reservation = await Reservation.create({ ...req.body, phoneKey: normalizedPhone, reservationNumber: reservationNumber(), user: req.user._id });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.phoneKey) throw new AppError("This phone number already has an active reservation for this time slot", 409);
    throw error;
  }
  sendReservationConfirmationEmail(reservation).catch((error) => console.error("[email] reservation confirmation failed:", error.message));
  res.status(201).json({ data: reservation, message: "Reservation received and awaiting confirmation" });
});
export const getMyReservations = asyncHandler(async (req, res) => res.json({ data: await Reservation.find({ user: req.user._id }).sort({ date: -1, time: -1 }) }));
export const cancelReservation = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  const reservation = await Reservation.findOne({ _id: req.params.id, user: req.user._id });
  if (!reservation) throw new AppError("Reservation not found", 404);
  if (!["pending", "confirmed"].includes(reservation.status)) throw new AppError("This reservation cannot be cancelled", 409);
  reservation.status = "cancelled"; await reservation.save();
  res.json({ data: reservation, message: "Reservation cancelled" });
});
export const listAdminReservations = asyncHandler(async (_req, res) => res.json({ data: await Reservation.find().populate("user", "name email").sort({ date: -1, time: -1 }) }));
export const updateReservationStatus = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  const reservation = await Reservation.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!reservation) throw new AppError("Reservation not found", 404);
  if (["confirmed", "cancelled"].includes(reservation.status)) {
    sendReservationConfirmationEmail(reservation).catch((error) => console.error("[email] reservation status notification failed:", error.message));
  }
  res.json({ data: reservation, message: `Reservation marked ${reservation.status}` });
});

