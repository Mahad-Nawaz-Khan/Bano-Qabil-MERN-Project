import { Cart } from "../models/Cart.js";
import { ADMIN_TRANSITIONS, CUSTOMER_CANCELLABLE, Order, createOrderNumber } from "../models/Order.js";
import { priceCart } from "../services/cartService.js";
import { sendOrderConfirmationEmail, sendOrderStatusUpdateEmail } from "../services/emailService.js";
import { AppError, asyncHandler, requireId } from "../utils/errors.js";

const orderFromLines = (lines) => lines.map((line) => ({
  menuItem: line.menuItem,
  name: line.name,
  image: line.image,
  unitPrice: line.unitPrice,
  quantity: line.quantity,
  lineTotal: line.lineTotal,
}));

// Customers may only cancel, and only early; admins follow the transition table.
function moveTo(order, nextStatus, role) {
  const allowed = role === "admin"
    ? ADMIN_TRANSITIONS[order.status] ?? []
    : CUSTOMER_CANCELLABLE.includes(order.status) ? ["cancelled"] : [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(`An order that is ${order.status} cannot be marked as ${nextStatus}`, 409);
  }
  order.status = nextStatus;
  order.statusHistory.push({ status: nextStatus });
}

export const createOrder = asyncHandler(async (req, res) => {
  const idempotencyKey = req.valid["idempotency-key"];
  const existing = await Order.findOne({ user: req.user._id, idempotencyKey });
  if (existing) return res.status(201).json({ data: existing, message: "Order already on its way" });

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart?.items.length) throw new AppError("Your cart is empty", 400);

  const priced = await priceCart(cart);
  if (!priced.items.length) throw new AppError("None of the items in your cart are available right now", 409);
  if (priced.removed > 0) throw new AppError("Some items in your cart are no longer available. Review your cart and try again.", 409);

  let order;
  try {
    order = await Order.create({
      orderNumber: createOrderNumber(),
      user: req.user._id,
      idempotencyKey,
      items: orderFromLines(priced.items),
      subtotal: priced.subtotal,
      total: priced.total,
      status: "pending",
      statusHistory: [{ status: "pending" }],
      contact: req.body.contact,
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const duplicate = await Order.findOne({ user: req.user._id, idempotencyKey });
    if (duplicate) return res.status(201).json({ data: duplicate, message: "Order already on its way" });
    throw error;
  }

  cart.items = [];
  await cart.save();
  await sendOrderConfirmationEmail(req.user, order);
  res.status(201).json({ data: order, message: "Order placed" });
});

export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ data: orders });
});

export const getOrder = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  const order = await Order.findById(req.params.id);
  // 404 rather than 403 so the response does not reveal that the order exists.
  if (!order || (String(order.user) !== String(req.user._id) && req.user.role !== "admin")) {
    throw new AppError("Order not found", 404);
  }
  res.json({ data: order });
});

export const cancelOrder = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  const order = await Order.findById(req.params.id);
  if (!order || String(order.user) !== String(req.user._id)) throw new AppError("Order not found", 404);
  moveTo(order, "cancelled", "customer");
  await order.save();
  res.json({ data: order, message: "Order cancelled" });
});

export const listAdminOrders = asyncHandler(async (req, res) => {
  const { status, page, limit } = req.valid;
  const filter = status ? { status } : {};
  const [orders, total] = await Promise.all([
    Order.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
  ]);
  res.json({ data: orders, meta: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  const order = await Order.findById(req.params.id);
  if (!order) throw new AppError("Order not found", 404);
  moveTo(order, req.body.status, "admin");
  await order.save();
  await order.populate("user", "name email");
  if (order.user) {
    sendOrderStatusUpdateEmail(order.user, order).catch((err) =>
      console.error("[email] Failed to send status update email:", err.message),
    );
  }
  res.json({ data: order, message: `Order marked as ${order.status}` });
});
