import { Router } from "express";
import { z } from "zod";
import { cancelReservation, createReservation, getMyReservations, listAdminReservations, updateReservationStatus } from "../controllers/reservationController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { RESERVATION_STATUSES } from "../models/Reservation.js";

const booking = z.object({ name: z.string().trim().min(2).max(80), email: z.string().trim().toLowerCase().pipe(z.email()), phone: z.string().trim().min(7).max(30), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^(1[7-9]|2[0-3]):[0-5]\d$/), partySize: z.coerce.number().int().min(1).max(12), specialRequests: z.string().trim().max(300).optional().default(""), policyAccepted: z.literal(true) }).superRefine((value, context) => {
	const reservationDate = new Date(`${value.date}T${value.time}`);
	if (Number.isNaN(reservationDate.getTime()) || reservationDate <= new Date()) context.addIssue({ code: "custom", path: ["date"], message: "Reservation date and time must be in the future" });
});
export const reservationRouter = Router();
reservationRouter.use(requireAuth);
reservationRouter.get("/admin/all", requireRole("admin"), listAdminReservations);
reservationRouter.patch("/:id/status", requireRole("admin"), validate(z.object({ status: z.enum(RESERVATION_STATUSES) })), updateReservationStatus);
reservationRouter.post("/", validate(booking), createReservation);
reservationRouter.get("/", getMyReservations);
reservationRouter.post("/:id/cancel", cancelReservation);
