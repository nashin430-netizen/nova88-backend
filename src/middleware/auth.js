import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";

  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  try {
    req.user = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    next();
    } catch (error) {
    console.error("JWT VERIFY ERROR:", error.message);

    return res.status(401).json({
      error: "Invalid or expired token",
      reason: error.message
    });
  }

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({
      error: "Admin access required"
    });
  }

  next();
}

