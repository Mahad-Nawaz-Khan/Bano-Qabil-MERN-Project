import { Router } from "express";
import multer from "multer";
import { createCategory, createItem, deleteCategory, deleteItem, getCategories, getItems, getPublicMenu, updateCategory, updateItem, uploadItemImage } from "../controllers/menuController.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";

const adminOnly = [requireAuth, requireRole("admin")];
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => callback(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});

export const menuRouter = Router();
menuRouter.get("/menu", getPublicMenu);
menuRouter.get("/categories", getCategories);
menuRouter.post("/categories", adminOnly, createCategory);
menuRouter.patch("/categories/:id", adminOnly, updateCategory);
menuRouter.delete("/categories/:id", adminOnly, deleteCategory);
menuRouter.get("/menu-items", optionalAuth, getItems);
menuRouter.post("/menu-images", adminOnly, imageUpload.single("image"), uploadItemImage);
menuRouter.post("/menu-items", adminOnly, createItem);
menuRouter.patch("/menu-items/:id", adminOnly, updateItem);
menuRouter.delete("/menu-items/:id", adminOnly, deleteItem);
