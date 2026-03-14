const jwt = require("jsonwebtoken");

function protect(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== "Admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  return next();
}

function studentOnly(req, res, next) {
  if (req.user?.role !== "Student") {
    return res.status(403).json({ message: "Student access required" });
  }
  return next();
}

function staffOrAdminOnly(req, res, next) {
  if (req.user?.role !== "Admin" && req.user?.role !== "Staff") {
    return res.status(403).json({ message: "Staff or Admin access required" });
  }
  return next();
}

module.exports = { protect, adminOnly, studentOnly, staffOrAdminOnly };
