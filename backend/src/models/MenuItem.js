import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: [true, "Dish name is required"], trim: true, maxlength: 140 },
  description: { type: String, trim: true, maxlength: 600, default: "" },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price cannot be negative"],
    validate: {
      validator: Number.isInteger,
      message: "Price must be an integer (whole rupees)",
    },
  },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: [true, "Category is required"] },
  image: { type: String, trim: true, default: "" },
  isAvailable: { type: Boolean, default: true },
}, { timestamps: true });

menuItemSchema.index({ category: 1, name: 1 });
export const MenuItem = mongoose.model("MenuItem", menuItemSchema);
