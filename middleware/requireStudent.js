module.exports = function requireStudent(req, res, next) {
  if (req.session && req.session.studentId && req.session.student) return next();
  return res.status(401).json({ message: "Please log in with your student account first." });
};
