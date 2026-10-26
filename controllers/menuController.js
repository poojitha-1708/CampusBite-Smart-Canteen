const MenuItem = require("../models/MenuItem");

exports.getMenu = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.category && req.query.category !== "All") filter.category = req.query.category;
    if (req.query.available === "true") filter.available = true;
    if (req.query.search) filter.name = { $regex: req.query.search, $options: "i" };
    res.json(await MenuItem.find(filter).sort({ category: 1, name: 1 }));
  } catch (err) { next(err); }
};

exports.createMenuItem = async (req, res, next) => {
  try { res.status(201).json(await MenuItem.create(req.body)); }
  catch (err) { next(err); }
};

exports.updateMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json(item);
  } catch (err) { next(err); }
};

exports.deleteMenuItem = async (req, res, next) => {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: "Menu item not found" });
    res.json({ message: "Menu item deleted" });
  } catch (err) { next(err); }
};

exports.seedMenu = async (req, res, next) => {
  try {
    const count = await MenuItem.countDocuments();
    if (count > 0) return res.json({ message: "Menu already has items", count });
    const sample = [
      { name: "Masala Dosa", category: "Breakfast", description: "Crispy dosa with potato masala and chutney", price: 55, image: "🥞", prepTime: 12 },
      { name: "Idli Sambar", category: "Breakfast", description: "Soft idlis served with sambar and chutney", price: 35, image: "🥣", prepTime: 8 },
      { name: "Veg Meals", category: "Meals", description: "Rice, dal, seasonal curry, curd and pickle", price: 85, image: "🍛", prepTime: 15 },
      { name: "Paneer Fried Rice", category: "Meals", description: "Wok-tossed rice with paneer and vegetables", price: 95, image: "🍚", prepTime: 14 },
      { name: "Veg Sandwich", category: "Snacks", description: "Toasted sandwich with fresh vegetables", price: 45, image: "🥪", prepTime: 7 },
      { name: "Samosa (2 pcs)", category: "Snacks", description: "Golden pastry with spiced potato filling", price: 25, image: "🥟", prepTime: 5 },
      { name: "Cold Coffee", category: "Beverages", description: "Chilled coffee with a creamy finish", price: 50, image: "🥤", prepTime: 4 },
      { name: "Fresh Lime Soda", category: "Beverages", description: "Refreshing lime soda, sweet or salted", price: 30, image: "🍋", prepTime: 3 }
    ];
    const items = await MenuItem.insertMany(sample);
    res.status(201).json({ message: "Sample menu created", count: items.length });
  } catch (err) { next(err); }
};
