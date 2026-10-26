const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  category: { type: String, required: true, enum: ["Breakfast", "Meals", "Snacks", "Beverages"] },
  description: { type: String, default: "", maxlength: 240 },
  price: { type: Number, required: true, min: 1 },
  image: { type: String, default: "🍽️" },
  available: { type: Boolean, default: true },
  prepTime: { type: Number, default: 10, min: 1 }
}, { timestamps: true });

module.exports = mongoose.model("MenuItem", menuItemSchema);
