const express = require("express");
const c = require("../controllers/orderController");
const requireAdmin = require("../middleware/requireAdmin");
const router = express.Router();

router.get("/stats", requireAdmin, c.getStats);
router.get("/", requireAdmin, c.getOrders);
router.post("/", c.createOrder);
router.patch("/:id/status", requireAdmin, c.updateOrderStatus);

module.exports = router;
