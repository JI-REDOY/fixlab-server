const express = require("express");
const router = express.Router();
const {
  createPaymentIntent,
  confirmCardPayment,
  createCheckoutSession,
  verifyPayment,
  getCustomerPayments,
  createSubscriptionCheckout,
  verifySubscriptionPayment,
} = require("../controllers/paymentController");
const { verifyToken, verifyCustomer } = require("../middlewares/auth");

router.post("/create-intent", verifyToken, verifyCustomer, createPaymentIntent);
router.post("/confirm", verifyToken, verifyCustomer, confirmCardPayment);
router.post(
  "/create-checkout-session",
  verifyToken,
  verifyCustomer,
  createCheckoutSession
);
router.get("/verify", verifyToken, verifyCustomer, verifyPayment);
router.get("/my-payments", verifyToken, verifyCustomer, getCustomerPayments);

router.post("/subscription/checkout", verifyToken, createSubscriptionCheckout);
router.post("/subscription/verify", verifyToken, verifySubscriptionPayment);

module.exports = router;