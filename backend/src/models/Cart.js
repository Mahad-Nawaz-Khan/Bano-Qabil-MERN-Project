import mongoose from "mongoose";

export const MAX_ITEM_QUANTITY = 20;

const cartItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  quantity: {
    type: Number,
    required: true,
    min: [1, "Quantity must be at least 1"],
    max: [MAX_ITEM_QUANTITY, `Quantity cannot exceed ${MAX_ITEM_QUANTITY}`],
  },
}, { _id: false });

// Lines hold no price: the cart is repriced from the menu on every read.
const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: { type: [cartItemSchema], default: [] },
}, { timestamps: true, optimisticConcurrency: true });

export const Cart = mongoose.model("Cart", cartSchema);
