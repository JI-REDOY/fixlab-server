const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Service = require("../models/Service");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create a booking (Customer only)
const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      customerPhone,
      address,
      preferredDate,
      problemDescription,
    } = req.body;

    if (
      !serviceId ||
      !customerPhone ||
      !address ||
      !preferredDate ||
      !problemDescription
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (String(problemDescription).trim().length < 20) {
      return res.status(400).json({
        message: "Problem description must be at least 20 characters",
      });
    }

    if (!isValidObjectId(serviceId)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (service.approvalStatus !== "approved" || !service.isAvailable) {
      return res
        .status(400)
        .json({ message: "Service is currently not available" });
    }
    if (
      service.technicianEmail &&
      service.technicianEmail.toLowerCase() === String(req.user.email).toLowerCase()
    ) {
      return res
        .status(400)
        .json({ message: "You cannot book your own service" });
    }

    // Prevent duplicate active requests
    const existingBooking = await Booking.findOne({
      serviceId,
      customerEmail: req.user.email,
      status: { $in: ["requested", "accepted", "in-progress"] },
    });

    if (existingBooking) {
      return res.status(400).json({
        message: "You already have an active request for this service",
      });
    }

    const newBooking = new Booking({
      serviceId,
      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,
      finalAmount: service.basePrice,
      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone: String(customerPhone).trim(),
      address: String(address).trim(),
      preferredDate,
      problemDescription: String(problemDescription).trim(),
      status: "requested",
      paymentStatus: "unpaid",
    });

    await newBooking.save();
    res.status(201).json({
      message: "Repair request sent successfully",
      booking: newBooking,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Failed to create booking", error: error.message });
  }
};

// Get customer bookings
const getCustomerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      customerEmail: req.user.email,
    }).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get technician bookings
const getTechnicianBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      technicianEmail: req.user.email,
    }).sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update booking status (Technician only - Challenge 3)
const updateBookingStatus = async (req, res) => {
  try {
    const { status, finalAmount } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.technicianEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your job" });
    }

    if (["rejected", "cancelled", "completed"].includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot change status from '${booking.status}'`,
      });
    }

    // Pipeline Validation
    if (
      booking.status === "requested" &&
      !["accepted", "rejected"].includes(status)
    ) {
      return res.status(400).json({ message: "Invalid status transition" });
    }
    if (booking.status === "accepted" && status !== "in-progress") {
      return res.status(400).json({ message: "Invalid status transition" });
    }
    if (booking.status === "in-progress" && status !== "completed") {
      return res.status(400).json({ message: "Invalid status transition" });
    }

    const numericAmount = Number(finalAmount);
    if (
      status === "completed" &&
      (Number.isNaN(numericAmount) || numericAmount <= 0)
    ) {
      return res
        .status(400)
        .json({ message: "Final amount greater than 0 is required for completion" });
    }

    booking.status = status;
    if (status === "completed") {
      booking.finalAmount = numericAmount;
    }

    await booking.save();
    res
      .status(200)
      .json({ message: "Status updated successfully", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Cancel booking (Customer only - only while requested)
const cancelBooking = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.customerEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your booking" });
    }
    if (booking.status !== "requested") {
      return res
        .status(400)
        .json({ message: "Only requested jobs can be cancelled" });
    }

    booking.status = "cancelled";
    await booking.save();
    res.status(200).json({ message: "Booking cancelled", booking });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Dashboard Stats
const getCustomerStats = async (req, res) => {
  try {
    const total = await Booking.countDocuments({
      customerEmail: req.user.email,
    });
    const active = await Booking.countDocuments({
      customerEmail: req.user.email,
      status: { $in: ["requested", "accepted", "in-progress"] },
    });
    const completed = await Booking.countDocuments({
      customerEmail: req.user.email,
      status: "completed",
    });
    res.status(200).json({ total, active, completed });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTechnicianStats = async (req, res) => {
  try {
    const totalServices = await Service.countDocuments({
      technicianEmail: req.user.email,
    });
    const approvedServices = await Service.countDocuments({
      technicianEmail: req.user.email,
      approvalStatus: "approved",
    });
    const pendingRequests = await Booking.countDocuments({
      technicianEmail: req.user.email,
      status: "requested",
    });
    res
      .status(200)
      .json({ totalServices, approvedServices, pendingRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Customer gives rating after payment
const addReview = async (req, res) => {
  try {
    const { rating, review } = req.body;

    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid booking ID" });
    }

    const numericRating = Number(rating);
    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.customerEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your booking" });
    }
    if (booking.paymentStatus !== "paid") {
      return res
        .status(400)
        .json({ message: "Can only review paid bookings" });
    }

    booking.rating = numericRating;
    booking.review = typeof review === "string" ? review.trim() : "";
    await booking.save();

    res.status(200).json({ message: "Review added successfully", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createBooking,
  getCustomerBookings,
  getTechnicianBookings,
  updateBookingStatus,
  cancelBooking,
  getCustomerStats,
  getTechnicianStats,
  addReview,
};