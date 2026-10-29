const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." }
});

router.get("/me", (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin) });
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedUsername || !expectedPassword) {
      return res.status(500).json({ message: "Admin credentials are not configured in .env" });
    }
    // Hash the configured password before comparison; no plain-text comparison against user input.
    const hash = await bcrypt.hash(expectedPassword, 12);
    const validUsername = typeof username === "string" && username === expectedUsername;
    const validPassword = typeof password === "string" && await bcrypt.compare(password, hash);
    if (!validUsername || !validPassword) {
      return res.status(401).json({ message: "Invalid username or password" });
    }
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.isAdmin = true;
      req.session.adminUsername = expectedUsername;
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json({ message: "Admin login successful", isAdmin: true });
      });
    });
  } catch (err) { next(err); }
});

router.post("/logout", (req, res, next) => {
  if (!req.session) return res.json({ message: "Logged out" });
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("campusbite.sid");
    res.json({ message: "Logged out successfully" });
  });
});

module.exports = router;
