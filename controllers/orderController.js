const Order = require("../models/Order");
const MenuItem = require("../models/MenuItem");

exports.getOrders = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && req.query.status !== "All") filter.status = req.query.status;
    const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(100);
    res.json(orders);
  } catch (err) { next(err); }
};

exports.createOrder = async (req, res, next) => {
  try {
    const { customerName, studentId, items, pickupNote } = req.body;
    if (!customerName || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Name and at least one cart item are required" });
    }
    const orderItems = [];
    for (const entry of items) {
      const menuItem = await MenuItem.findById(entry.menuItem);
      if (!menuItem || !menuItem.available) {
        return res.status(400).json({ message: "One of the selected items is unavailable. Refresh the menu." });
      }
      const quantity = Math.max(1, Math.min(20, Number(entry.quantity) || 1));
      orderItems.push({ menuItem: menuItem._id, name: menuItem.name, price: menuItem.price, quantity });
    }
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({ customerName, studentId, items: orderItems, totalAmount, pickupNote });
    res.status(201).json(order);
  } catch (err) { next(err); }
};

exports.updateOrderStatus = async (req, res, next) => {
  try {
    const allowed = ["Received", "Preparing", "Ready", "Completed", "Cancelled"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ message: "Invalid order status" });
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) { next(err); }
};

exports.getStats = async (req, res, next) => {
  try {
    const [totalOrders, activeOrders, revenueResult, menuCount] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: { $in: ["Received", "Preparing", "Ready"] } }),
      Order.aggregate([{ $match: { status: { $ne: "Cancelled" } } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]),
      MenuItem.countDocuments({ available: true })
    ]);
    res.json({ totalOrders, activeOrders, revenue: revenueResult[0]?.total || 0, availableMenuItems: menuCount });
  } catch (err) { next(err); }
};
