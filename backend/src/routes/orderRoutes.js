import { Router } from "express";
import { z } from "zod";
import { cancelOrder, createOrder, getMyOrders, getOrder, listAdminOrders, updateOrderStatus } from "../controllers/orderController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { ORDER_STATUSES, PAYMENT_METHODS } from "../models/Order.js";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Contact name is required").max(80, "Contact name is too long"),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(30, "Enter a valid phone number"),
  address: z.string().trim().min(5, "Delivery address is required").max(300, "Delivery address is too long"),
  note: z.string().trim().max(300, "Note is too long").optional().default(""),
});

const checkoutSchema = z.object({ contact: contactSchema, paymentMethod: z.enum(PAYMENT_METHODS).default("cash") });
// Non-string (absent) headers get the same guidance as malformed ones.
const idempotencyKeySchema = z.object({
  "idempotency-key": z.string({ error: "Send a valid Idempotency-Key" }).uuid("Send a valid Idempotency-Key"),
});
const statusSchema = z.object({ status: z.enum(ORDER_STATUSES, { error: "Unknown order status" }) });
const listQuerySchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const orderRouter = Router();
orderRouter.use(requireAuth);

// Admin routes are registered before "/:id" so "admin" is never read as an order id.
orderRouter.get("/admin/all", requireRole("admin"), validate(listQuerySchema, "query"), listAdminOrders);
orderRouter.patch("/:id/status", requireRole("admin"), validate(statusSchema), updateOrderStatus);

orderRouter.post("/", validate(checkoutSchema), validate(idempotencyKeySchema, "headers"), createOrder);
orderRouter.get("/", getMyOrders);
orderRouter.post("/:id/cancel", cancelOrder);
orderRouter.get("/:id", getOrder);
