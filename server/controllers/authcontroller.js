const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const User = require("../models/User");

// ─── Helper: Generate JWT ────────────────────────────────────────────────────
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// Helper: send token response
const sendTokenResponse = (user, statusCode, res, message = "Success") => {
  const token = generateToken(user._id);

  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  };

  res
    .status(statusCode)
    .cookie("token", token, cookieOptions)
    .json({
      success: true,
      message,
      token,
      user,
    });
};

// ─── @route   POST /api/auth/register ────────────────────────────────────────
// @desc    Register a new user (role: user | vendor | admin)
// @access  Public (admin registration requires secret key)
const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { name, email, password, phone, role, vendorDetails, adminSecret } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "Email already registered." });
    }

    // Admin registration requires a secret key (set in .env)
    if (role === "admin") {
      if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
        return res.status(403).json({
          success: false,
          message: "Invalid admin secret key.",
        });
      }
    }

    const userData = { name, email, password, role: role || "user", phone };

    // Attach vendor-specific details if registering as vendor
    if (role === "vendor") {
      if (!vendorDetails?.pharmacyName || !vendorDetails?.licenseNumber) {
        return res.status(400).json({
          success: false,
          message: "Vendor registration requires pharmacyName and licenseNumber.",
        });
      }
      userData.vendorDetails = {
        pharmacyName: vendorDetails.pharmacyName,
        licenseNumber: vendorDetails.licenseNumber,
        address: vendorDetails.address || {},
        isVerified: false, // Admin must verify vendor
      };
    }

    const user = await User.create(userData);

    const message =
      role === "vendor"
        ? "Vendor account created. Pending admin verification."
        : "Registration successful.";

    sendTokenResponse(user, 201, res, message);
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ success: false, message: error });
  }
};

// ─── @route   POST /api/auth/login ───────────────────────────────────────────
// @desc    Login user / vendor / admin
// @access  Public
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Fetch user with password (select: false by default)
    const user = await User.findOne({ email }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact support.",
      });
    }

    // Update last login timestamp
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res, "Login successful.");
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: error});
  }
};

// ─── @route   GET /api/auth/me ────────────────────────────────────────────────
// @desc    Get currently logged-in user profile
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("savedMedicines", "name genericName");

    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, message: "Could not fetch profile." });
  }
};

// ─── @route   POST /api/auth/logout ──────────────────────────────────────────
// @desc    Logout user (clear cookie)
// @access  Private
const logout = (req, res) => {
  res
    .status(200)
    .cookie("token", "none", {
      expires: new Date(Date.now() + 5 * 1000),
      httpOnly: true,
    })
    .json({ success: true, message: "Logged out successfully." });
};

// ─── @route   PUT /api/auth/change-password ──────────────────────────────────
// @desc    Change password for logged-in user
// @access  Private
const changePassword = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select("+password");

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, "Password changed successfully.");
  } catch (error) {
    console.error("ChangePassword error:", error);
    res.status(500).json({ success: false, message: "Could not change password." });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = ["name", "phone", "profilePicture"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Vendors can update their pharmacy details
    if (req.user.role === "vendor" && req.body.vendorDetails) {
      const vd = req.body.vendorDetails;
      if (vd.pharmacyName) updates["vendorDetails.pharmacyName"] = vd.pharmacyName;
      if (vd.licenseNumber) updates["vendorDetails.licenseNumber"] = vd.licenseNumber;
      if (vd.address) updates["vendorDetails.address"] = vd.address;
      if (vd.address?.coordinates) {
        const { lat, lng } = vd.address.coordinates;
        if (lat && lng) {
          updates["vendorDetails.location"] = {
            type: "Point",
            coordinates: [lng, lat],
          };
        }
      }
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, message: "Profile updated.", user });
  } catch (error) {
    console.error("UpdateProfile error:", error);
    res.status(500).json({ success: false, message: "Could not update profile." });
  }
};

module.exports = { register, login, getMe, logout, changePassword, updateProfile };