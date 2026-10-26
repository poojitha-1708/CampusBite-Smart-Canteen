const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  customerName: { type: String, required: true, trim: true, maxlength: 80 },
  studentId: { type: String, default: "", trim: true, maxlength: 40 },
  items: { type: [orderItemSchema], validate: v => v.length > 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["Received", "Preparing", "Ready", "Completed", "Cancelled"], default: "Received" },
  pickupNote: { type: String, default: "", maxlength: 200 }
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
