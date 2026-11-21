const express = require("express");
const router = express.Router();
const {
  createBooking,
  getCustomerBookings,
  getTechnicianBookings,
  updateBookingStatus,
  cancelBooking,
  getCustomerStats,
  getTechnicianStats,
  addReview,
} = require("../controllers/bookingController");
const {
  verifyToken,
  verifyCustomer,
  verifyTechnician,
} = require("../middlewares/auth");

// Customer Routes
router.post("/", verifyToken, verifyCustomer, createBooking);
router.get("/my", verifyToken, verifyCustomer, getCustomerBookings);
router.get("/customer/stats", verifyToken, verifyCustomer, getCustomerStats);
router.patch("/:id/cancel", verifyToken, verifyCustomer, cancelBooking);
router.patch("/:id/review", verifyToken, verifyCustomer, addReview);

// Technician Routes
router.get("/technician", verifyToken, verifyTechnician, getTechnicianBookings);
router.get(
  "/technician/stats",
  verifyToken,
  verifyTechnician,
  getTechnicianStats
);
router.patch("/:id/status", verifyToken, verifyTechnician, updateBookingStatus);

module.exports = router;