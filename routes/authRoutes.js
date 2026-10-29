const express = require("express");
const bcrypt = require("bcryptjs");
const rateLimit = require("express-rate-limit");
const Student = require("../models/Student");
const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { message: "Too many login attempts. Please try again in 15 minutes." }
});

router.get("/me", (req, res) => {
  res.json({ isAdmin: Boolean(req.session && req.session.isAdmin), isStudent: Boolean(req.session && req.session.studentId), student: req.session && req.session.student ? req.session.student : null });
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


// Student registration
router.post("/student/register", loginLimiter, async (req, res, next) => {
  try {
    const { name, email, studentId, password } = req.body || {};
    if (!name || !email || !studentId || typeof password !== "string" || password.length < 8) {
      return res.status(400).json({ message: "Enter your name, email, student ID, and a password of at least 8 characters." });
    }
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedId = String(studentId).trim();
    const existing = await Student.findOne({ $or: [{ email: normalizedEmail }, { studentId: normalizedId }] });
    if (existing) return res.status(409).json({ message: "That email or student ID is already registered." });
    const passwordHash = await bcrypt.hash(password, 12);
    const student = await Student.create({ name: String(name).trim(), email: normalizedEmail, studentId: normalizedId, passwordHash });
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.studentId = String(student._id);
      req.session.student = { name: student.name, email: student.email, studentId: student.studentId };
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.status(201).json({ message: "Student account created successfully", student: req.session.student, isStudent: true });
      });
    });
  } catch (err) { if (err.code === 11000) return res.status(409).json({ message: "Email or student ID already exists." }); next(err); }
});

router.post("/student/login", loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: "Enter your email and password." });
    const student = await Student.findOne({ email: String(email).trim().toLowerCase() });
    if (!student || !(await bcrypt.compare(String(password), student.passwordHash))) {
      return res.status(401).json({ message: "Invalid student email or password." });
    }
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.studentId = String(student._id);
      req.session.student = { name: student.name, email: student.email, studentId: student.studentId };
      req.session.save((saveErr) => {
        if (saveErr) return next(saveErr);
        res.json({ message: "Student login successful", student: req.session.student, isStudent: true });
      });
    });
  } catch (err) { next(err); }
});

router.post("/student/logout", (req, res, next) => {
  if (!req.session) return res.json({ message: "Logged out" });
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("campusbite.sid");
    res.json({ message: "Student logged out successfully" });
  });
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
