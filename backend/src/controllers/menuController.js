import mongoose from "mongoose";
import { Category } from "../models/Category.js";
import { MenuItem } from "../models/MenuItem.js";

const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

function requireId(id) {
  if (!mongoose.isValidObjectId(id)) {
    const error = new Error("Invalid resource id");
    error.status = 400;
    throw error;
  }
}

export const getPublicMenu = asyncHandler(async (_req, res) => {
  const categories = await Category.find().sort({ name: 1 }).lean();
  const items = await MenuItem.find({ isAvailable: true }).sort({ name: 1 }).lean();
  const data = categories.map((category) => ({
    ...category,
    category: category.name,
    items: items.filter((item) => String(item.category) === String(category._id)).map((item) => ({ ...item, img: item.image })),
  })).filter((category) => category.items.length > 0);
  res.json({ data });
});

export const getCategories = asyncHandler(async (_req, res) => res.json({ data: await Category.find().sort({ name: 1 }) }));
export const createCategory = asyncHandler(async (req, res) => {
  const category = await Category.create(req.body);
  res.status(201).json({ message: "Category created", data: category });
});
export const updateCategory = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });
  category.set(req.body);
  await category.save();
  res.json({ message: "Category updated", data: category });
});
export const deleteCategory = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  if (await MenuItem.exists({ category: req.params.id })) return res.status(409).json({ message: "Move or delete this category's menu items first" });
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ message: "Category not found" });
  res.status(204).send();
});

export const getItems = asyncHandler(async (req, res) => {
  const filter = req.query.includeInactive === "true" ? {} : { isAvailable: true };
  res.json({ data: await MenuItem.find(filter).populate("category", "name slug").sort({ createdAt: -1 }) });
});
export const createItem = asyncHandler(async (req, res) => {
  const item = await MenuItem.create(req.body);
  await item.populate("category", "name slug");
  res.status(201).json({ message: "Menu item created", data: item });
});
export const updateItem = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate("category", "name slug");
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  res.json({ message: "Menu item updated", data: item });
});
export const deleteItem = asyncHandler(async (req, res) => {
  requireId(req.params.id);
  const item = await MenuItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Menu item not found" });
  res.status(204).send();
});
