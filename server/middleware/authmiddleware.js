const jwt = require("jsonwebtoken");
const User = require("../models/User");

// ─── Verify JWT Token ────────────────────────────────────────────────────────
const protect = async (req, res, next) => {
  let token;

  // Accept token from Authorization header or cookie
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Access denied. No token provided.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User belonging to this token no longer exists.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated. Contact support.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token has expired. Please log in again." });
    }
    return res.status(500).json({ success: false, message: "Token verification failed." });
  }
};

// ─── Role-Based Access Control ───────────────────────────────────────────────
// Usage: authorize("admin") or authorize("admin", "vendor")
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized for this action.`,
      });
    }

    next();
  };
};

// ─── Vendor Verification Check ───────────────────────────────────────────────
// Ensures vendor has been approved by admin before accessing vendor routes
const requireVerifiedVendor = (req, res, next) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ success: false, message: "Vendor access only." });
  }

  if (!req.user.vendorDetails?.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Your vendor account is pending admin approval. You'll be notified once approved.",
    });
  }

  next();
};

module.exports = { protect, authorize, requireVerifiedVendor };