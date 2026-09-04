import { Cart } from "../models/Cart.js";
import { MenuItem } from "../models/MenuItem.js";
import { clampQuantity, mergeGuestItems, priceCart, upsertCart } from "../services/cartService.js";
import { AppError, asyncHandler, requireId } from "../utils/errors.js";

const respond = async (res, cart, status = 200) => res.status(status).json({ data: await priceCart(cart) });

export const getCart = asyncHandler(async (req, res) => respond(res, await Cart.findOne({ user: req.user._id })));

export const addItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.findOne({ _id: req.body.menuItem, isAvailable: true });
  if (!item) throw new AppError("That dish is no longer available", 404);
  const cart = await upsertCart(req.user._id);
  const line = cart.items.find((entry) => String(entry.menuItem) === String(item._id));
  if (line) line.quantity = clampQuantity(line.quantity + req.body.quantity);
  else cart.items.push({ menuItem: item._id, quantity: req.body.quantity });
  await cart.save();
  await respond(res, cart, 201);
});

export const updateItem = asyncHandler(async (req, res) => {
  requireId(req.params.menuItemId);
  const cart = await Cart.findOne({ user: req.user._id });
  const line = cart?.items.find((entry) => String(entry.menuItem) === req.params.menuItemId);
  if (!line) throw new AppError("That dish is not in your cart", 404);
  line.quantity = req.body.quantity;
  await cart.save();
  await respond(res, cart);
});

export const removeItem = asyncHandler(async (req, res) => {
  requireId(req.params.menuItemId);
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter((entry) => String(entry.menuItem) !== req.params.menuItemId);
    await cart.save();
  }
  await respond(res, cart);
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = [];
    await cart.save();
  }
  await respond(res, cart);
});

export const mergeCart = asyncHandler(async (req, res) => {
  const cart = await mergeGuestItems(await upsertCart(req.user._id), req.body.items);
  await respond(res, cart);
});
