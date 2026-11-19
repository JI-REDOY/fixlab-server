const express = require('express');
const router = express.Router();
const { createCheckoutSession, verifyPayment, getCustomerPayments } = require('../controllers/paymentController');
const { verifyToken, verifyCustomer } = require('../middlewares/auth');

router.post('/create-checkout-session', verifyToken, verifyCustomer, createCheckoutSession);
router.get('/verify', verifyToken, verifyPayment); // Not customer-only, any logged-in user with session
router.get('/my-payments', verifyToken, verifyCustomer, getCustomerPayments);

module.exports = router;