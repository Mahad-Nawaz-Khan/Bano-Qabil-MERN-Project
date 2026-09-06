import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { createCategory, createItem, deleteCategory, deleteItem, getCategories, getItems, getPublicMenu, updateCategory, updateItem, uploadItemImage } from "../controllers/menuController.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";

const adminOnly = [requireAuth, requireRole("admin")];
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});

const objectId = z.string().trim().regex(/^[a-f0-9]{24}$/i, "Invalid reference id");

const categorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(80, "Category name is too long"),
  description: z.string().trim().max(300, "Description is too long").optional().default(""),
  sortOrder: z.coerce.number().int().min(0).optional().default(0),
});

const categoryUpdateSchema = categorySchema.partial();

const menuItemSchema = z.object({
  name: z.string().trim().min(1, "Dish name is required").max(140, "Dish name is too long"),
  description: z.string().trim().max(600, "Description is too long").optional().default(""),
  price: z.coerce.number().int("Price must be whole rupees").min(0, "Price cannot be negative"),
  category: objectId,
  image: z.string().trim().max(500).optional().default(""),
  isAvailable: z.boolean().optional().default(true),
});

const menuItemUpdateSchema = menuItemSchema.partial();

export const menuRouter = Router();
menuRouter.get("/menu", getPublicMenu);
menuRouter.get("/categories", getCategories);
menuRouter.post("/categories", adminOnly, validate(categorySchema), createCategory);
menuRouter.patch("/categories/:id", adminOnly, validate(categoryUpdateSchema), updateCategory);
menuRouter.delete("/categories/:id", adminOnly, deleteCategory);
menuRouter.get("/menu-items", optionalAuth, getItems);
menuRouter.post("/menu-images", adminOnly, imageUpload.single("image"), uploadItemImage);
menuRouter.post("/menu-items", adminOnly, validate(menuItemSchema), createItem);
menuRouter.patch("/menu-items/:id", adminOnly, validate(menuItemUpdateSchema), updateItem);
menuRouter.delete("/menu-items/:id", adminOnly, deleteItem);
