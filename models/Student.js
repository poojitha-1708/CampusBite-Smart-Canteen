const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  studentId: { type: String, required: true, unique: true, trim: true, maxlength: 40 },
  passwordHash: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Student", studentSchema);
