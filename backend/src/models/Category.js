import mongoose from "mongoose";

const toSlug = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const categorySchema = new mongoose.Schema({
  name: { type: String, required: [true, "Category name is required"], trim: true, unique: true, maxlength: 80 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, trim: true, maxlength: 300, default: "" },
  sortOrder: { type: Number, default: 0 },
}, { timestamps: true });

categorySchema.pre("validate", function setSlug(next) {
  if (this.isModified("name")) this.slug = toSlug(this.name);
  next();
});

export const Category = mongoose.model("Category", categorySchema);
