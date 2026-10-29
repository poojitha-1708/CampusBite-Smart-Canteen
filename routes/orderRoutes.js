const express = require("express");
const c = require("../controllers/orderController");
const requireAdmin = require("../middleware/requireAdmin");
const requireStudent = require("../middleware/requireStudent");
const router = express.Router();

router.get("/stats", requireAdmin, c.getStats);
router.post("/track", requireStudent, c.trackOrders);
router.get("/", requireAdmin, c.getOrders);
router.post("/", requireStudent, c.createOrder);
router.patch("/:id/status", requireAdmin, c.updateOrderStatus);

module.exports = router;
