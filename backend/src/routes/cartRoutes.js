import { Router } from "express";
import { z } from "zod";
import { addItem, clearCart, getCart, mergeCart, removeItem, updateItem } from "../controllers/cartController.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { MAX_ITEM_QUANTITY } from "../models/Cart.js";

const objectId = z.string().trim().regex(/^[a-f0-9]{24}$/i, "Invalid dish reference");
const quantity = z.coerce
  .number()
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(MAX_ITEM_QUANTITY, `Quantity cannot exceed ${MAX_ITEM_QUANTITY}`);

const addSchema = z.object({ menuItem: objectId, quantity: quantity.default(1) });
const quantitySchema = z.object({ quantity });
const mergeSchema = z.object({
  items: z.array(z.object({ menuItem: objectId, quantity })).max(50, "That cart has too many lines").default([]),
});

export const cartRouter = Router();
cartRouter.use(requireAuth);
cartRouter.get("/", getCart);
cartRouter.post("/items", validate(addSchema), addItem);
cartRouter.patch("/items/:menuItemId", validate(quantitySchema), updateItem);
cartRouter.delete("/items/:menuItemId", removeItem);
cartRouter.delete("/", clearCart);
cartRouter.post("/merge", validate(mergeSchema), mergeCart);
