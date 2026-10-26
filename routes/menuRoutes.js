const express = require("express");
const c = require("../controllers/menuController");
const requireAdmin = require("../middleware/requireAdmin");
const router = express.Router();

router.get("/", c.getMenu);
router.post("/seed", requireAdmin, c.seedMenu);
router.post("/", requireAdmin, c.createMenuItem);
router.put("/:id", requireAdmin, c.updateMenuItem);
router.delete("/:id", requireAdmin, c.deleteMenuItem);

module.exports = router;
