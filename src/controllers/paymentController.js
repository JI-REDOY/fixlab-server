const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const Payment = require('../models/Payment'); // এটি একবারই থাকবে

// Create Stripe Checkout Session
const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findById(bookingId);

    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.customerEmail !== req.user.email) return res.status(403).json({ message: 'Unauthorized' });
    if (booking.status !== 'completed' || booking.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Payment not allowed for this booking' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: booking.serviceTitle },
          unit_amount: booking.finalAmount * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: { bookingId: booking._id.toString(), customerEmail: req.user.email },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify Payment (Success Page)
const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === 'paid') {
      const existingPayment = await Payment.findOne({ stripeSessionId: session.id });
      if (!existingPayment) {
        const booking = await Booking.findById(session.metadata.bookingId);
        
        const payment = new Payment({
          bookingId: session.metadata.bookingId,
          serviceTitle: booking.serviceTitle,
          customerName: booking.customerName,
          customerEmail: booking.customerEmail,
          technicianName: booking.technicianName,
          technicianEmail: booking.technicianEmail,
          amount: session.amount_total / 100,
          transactionId: session.payment_intent,
          stripeSessionId: session.id,
          paymentStatus: 'paid',
        });
        await payment.save();

        booking.paymentStatus = 'paid';
        await booking.save();
      }
      res.status(200).json({ message: 'Payment verified successfully' });
    } else {
      res.status(400).json({ message: 'Payment not completed' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Customer Payments (New Endpoint)
const getCustomerPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ customerEmail: req.user.email }).sort({ paidAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCheckoutSession, verifyPayment, getCustomerPayments };