const User = require("../models/User");

// ─── @route   GET /api/admin/users ───────────────────────────────────────────
// @desc    Get all users (filterable by role)
// @access  Admin only
const getAllUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      users,
    });
  } catch (error) {
    console.error("GetAllUsers error:", error);
    res.status(500).json({ success: false, message: "Could not fetch users." });
  }
};

// ─── @route   GET /api/admin/vendors/pending ─────────────────────────────────
// @desc    Get all vendors pending verification
// @access  Admin only
const getPendingVendors = async (req, res) => {
  try {
    const vendors = await User.find({
      role: "vendor",
      "vendorDetails.isVerified": false,
    }).select("-password");

    res.status(200).json({ success: true, count: vendors.length, vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: "Could not fetch pending vendors." });
  }
};

// ─── @route   PUT /api/admin/vendors/:id/verify ──────────────────────────────
// @desc    Approve or reject a vendor
// @access  Admin only
const verifyVendor = async (req, res) => {
  try {
    const { approve } = req.body; // true = approve, false = reject

    const vendor = await User.findOne({ _id: req.params.id, role: "vendor" });

    if (!vendor) {
      return res.status(404).json({ success: false, message: "Vendor not found." });
    }

    vendor.vendorDetails.isVerified = approve;
    vendor.vendorDetails.approvedAt = approve ? new Date() : null;
    vendor.vendorDetails.approvedBy = approve ? req.user._id : null;
    if (!approve) vendor.isActive = false;

    await vendor.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: approve ? "Vendor approved successfully." : "Vendor rejected and deactivated.",
      vendor,
    });
  } catch (error) {
    console.error("VerifyVendor error:", error);
    res.status(500).json({ success: false, message: "Could not update vendor status." });
  }
};

// ─── @route   PUT /api/admin/users/:id/toggle-status ────────────────────────
// @desc    Activate or deactivate any user account
// @access  Admin only
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot deactivate your own account." });
    }

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully.`,
      isActive: user.isActive,
    });
  } catch (error) {
    console.error("ToggleUserStatus error:", error);
    res.status(500).json({ success: false, message: "Could not update user status." });
  }
};

// ─── @route   DELETE /api/admin/users/:id ────────────────────────────────────
// @desc    Delete a user (hard delete)
// @access  Admin only
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Admins cannot delete themselves." });
    }

    await user.deleteOne();

    res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("DeleteUser error:", error);
    res.status(500).json({ success: false, message: "Could not delete user." });
  }
};

module.exports = { getAllUsers, getPendingVendors, verifyVendor, toggleUserStatus, deleteUser };