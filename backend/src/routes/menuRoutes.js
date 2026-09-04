import { Router } from "express";
import { createCategory, createItem, deleteCategory, deleteItem, getCategories, getItems, getPublicMenu, updateCategory, updateItem } from "../controllers/menuController.js";
import { optionalAuth, requireAuth, requireRole } from "../middleware/auth.js";

const adminOnly = [requireAuth, requireRole("admin")];

export const menuRouter = Router();
menuRouter.get("/menu", getPublicMenu);
menuRouter.get("/categories", getCategories);
menuRouter.post("/categories", adminOnly, createCategory);
menuRouter.patch("/categories/:id", adminOnly, updateCategory);
menuRouter.delete("/categories/:id", adminOnly, deleteCategory);
menuRouter.get("/menu-items", optionalAuth, getItems);
menuRouter.post("/menu-items", adminOnly, createItem);
menuRouter.patch("/menu-items/:id", adminOnly, updateItem);
menuRouter.delete("/menu-items/:id", adminOnly, deleteItem);
