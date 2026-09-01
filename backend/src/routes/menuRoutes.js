import { Router } from "express";
import { createCategory, createItem, deleteCategory, deleteItem, getCategories, getItems, getPublicMenu, updateCategory, updateItem } from "../controllers/menuController.js";

export const menuRouter = Router();
menuRouter.get("/menu", getPublicMenu);
menuRouter.get("/categories", getCategories);
menuRouter.post("/categories", createCategory);
menuRouter.patch("/categories/:id", updateCategory);
menuRouter.delete("/categories/:id", deleteCategory);
menuRouter.get("/menu-items", getItems);
menuRouter.post("/menu-items", createItem);
menuRouter.patch("/menu-items/:id", updateItem);
menuRouter.delete("/menu-items/:id", deleteItem);
