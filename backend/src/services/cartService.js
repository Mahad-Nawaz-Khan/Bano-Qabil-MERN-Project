import mongoose from "mongoose";
import { Cart, MAX_ITEM_QUANTITY } from "../models/Cart.js";
import { MenuItem } from "../models/MenuItem.js";

export const upsertCart = (userId) =>
  Cart.findOneAndUpdate({ user: userId }, { $setOnInsert: { user: userId, items: [] } }, { upsert: true, new: true, setDefaultsOnInsert: true });

/**
 * Rebuilds the cart from live menu data. Prices always come from the database, never from
 * the client, and lines whose dish disappeared or went unavailable are dropped from storage.
 */
export async function priceCart(cart) {
  if (!cart?.items.length) return { items: [], subtotal: 0, total: 0, count: 0, removed: 0 };

  const menuItems = await MenuItem.find({ _id: { $in: cart.items.map((line) => line.menuItem) }, isAvailable: true }).lean();
  const byId = new Map(menuItems.map((item) => [String(item._id), item]));

  const items = [];
  for (const line of cart.items) {
    const item = byId.get(String(line.menuItem));
    if (!item) continue;
    items.push({
      menuItem: item._id,
      name: item.name,
      image: item.image,
      unitPrice: item.price,
      quantity: line.quantity,
      lineTotal: item.price * line.quantity,
    });
  }

  const removed = cart.items.length - items.length;
  if (removed > 0 && cart._id) {
    cart.items = items.map((line) => ({ menuItem: line.menuItem, quantity: line.quantity }));
    await cart.save();
  }

  const subtotal = items.reduce((sum, line) => sum + line.lineTotal, 0);
  return { items, subtotal, total: subtotal, count: items.reduce((sum, line) => sum + line.quantity, 0), removed };
}

export const clampQuantity = (quantity) => Math.min(Math.max(quantity, 1), MAX_ITEM_QUANTITY);

/**
 * Folds a guest cart into the stored one. Unknown or unavailable ids are ignored rather
 * than rejected, because a guest cart can easily outlive a menu change.
 */
export async function mergeGuestItems(cart, guestItems) {
  const wanted = new Map();
  for (const line of guestItems) {
    if (!mongoose.isValidObjectId(line.menuItem)) continue;
    const key = String(line.menuItem);
    wanted.set(key, (wanted.get(key) || 0) + line.quantity);
  }
  if (!wanted.size) return cart;

  const available = await MenuItem.find({ _id: { $in: [...wanted.keys()] }, isAvailable: true }).select("_id").lean();
  for (const item of available) {
    const key = String(item._id);
    const existing = cart.items.find((line) => String(line.menuItem) === key);
    if (existing) existing.quantity = clampQuantity(existing.quantity + wanted.get(key));
    else cart.items.push({ menuItem: item._id, quantity: clampQuantity(wanted.get(key)) });
  }
  await cart.save();
  return cart;
}
