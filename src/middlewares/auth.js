const jwt = require("jsonwebtoken");
const User = require("../models/User");

const normalizeRole = (role) => {
  if (!role || typeof role !== "string") return "customer";
  const lower = role.trim().toLowerCase();
  if (lower === "admin" || lower === "technician" || lower === "customer") {
    return lower;
  }
  return "customer";
};

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "Server configuration error: JWT_SECRET missing" });
  }

  const token = authHeader.split(" ")[1]?.trim();
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: Token missing" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let dbUser = null;
    if (decoded?.email) {
      dbUser = await User.findOne({ email: decoded.email.toLowerCase() }).lean();
    }

    const effectiveRole = normalizeRole(dbUser?.role || decoded?.role);

    req.user = {
      ...decoded,
      id: dbUser?._id ? String(dbUser._id) : decoded?.id || decoded?.userId,
      email: (dbUser?.email || decoded?.email || "").toLowerCase(),
      name: dbUser?.name || decoded?.name || "",
      role: effectiveRole,
      roleConfirmed:
        typeof dbUser?.roleConfirmed === "boolean"
          ? dbUser.roleConfirmed
          : Boolean(decoded?.roleConfirmed),
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};

const verifyCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: User not authenticated" });
  }
  if (normalizeRole(req.user.role) !== "customer") {
    return res.status(403).json({ message: "Forbidden: Customer access only" });
  }
  next();
};

const verifyTechnician = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: User not authenticated" });
  }
  if (normalizeRole(req.user.role) !== "technician") {
    return res.status(403).json({ message: "Forbidden: Technician access only" });
  }
  next();
};

const verifyAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized: User not authenticated" });
  }
  if (normalizeRole(req.user.role) !== "admin") {
    return res.status(403).json({ message: "Forbidden: Admin access only" });
  }
  next();
};

module.exports = {
  verifyToken,
  verifyCustomer,
  verifyTechnician,
  verifyAdmin,
};