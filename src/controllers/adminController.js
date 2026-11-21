const mongoose = require("mongoose");
const User = require("../models/User");
const Service = require("../models/Service");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

const ALLOWED_ROLES = ["customer", "technician", "admin"];
const ALLOWED_APPROVAL_STATUSES = ["pending", "approved", "rejected"];

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({ message: "Invalid role value" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (String(user.email).toLowerCase() === String(req.user.email).toLowerCase()) {
      return res
        .status(400)
        .json({ message: "You cannot change your own role" });
    }

    user.role = role;
    await user.save();
    res.status(200).json({ message: "User role updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateServiceApproval = async (req, res) => {
  try {
    const { approvalStatus } = req.body;
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }
    if (!ALLOWED_APPROVAL_STATUSES.includes(approvalStatus)) {
      return res.status(400).json({ message: "Invalid approval status" });
    }

    const service = await Service.findByIdAndUpdate(
      req.params.id,
      { approvalStatus },
      { new: true }
    );
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    res.status(200).json({ message: `Service ${approvalStatus}`, service });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().sort({ paidAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllServices = async (req, res) => {
  try {
    const services = await Service.find().sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Dashboard Stats
const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTechnicians = await User.countDocuments({ role: "technician" });
    const pendingServices = await Service.countDocuments({
      approvalStatus: "pending",
    });
    res
      .status(200)
      .json({ totalUsers, totalTechnicians, pendingServices });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllUsers,
  updateUserRole,
  updateServiceApproval,
  getAllBookings,
  getAllPayments,
  getAllServices,
  getAdminStats,
};