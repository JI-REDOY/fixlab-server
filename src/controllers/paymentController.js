const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");

let legacyIndexDropped = false;

const ensureLegacySessionIndexDropped = async () => {
  if (legacyIndexDropped) return;
  try {
    await Payment.collection.dropIndex("stripeSessionId_1");
  } catch (_) {
    // Ignore if index does not exist or was already dropped
  } finally {
    legacyIndexDropped = true;
  }
};

const createPaymentIntent = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Valid bookingId is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.customerEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your booking" });
    }
    if (booking.status !== "completed" || booking.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ message: "Payment not allowed for this booking" });
    }

    const payableAmount = Number(booking.finalAmount ?? booking.basePrice ?? 0);
    if (!payableAmount || payableAmount <= 0) {
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    const customerName = booking.customerName || req.user.name || "Customer";
    const customerEmail = booking.customerEmail || req.user.email;
    const jobShortId = booking._id.toString().slice(-6).toUpperCase();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(payableAmount * 100),
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      receipt_email: customerEmail,
      description: `${booking.serviceTitle || "Repair Service"} - Job #${jobShortId}`,
      metadata: {
        bookingId: booking._id.toString(),
        customerName,
        customerEmail,
        technicianName: booking.technicianName || "",
        technicianEmail: booking.technicianEmail || "",
        serviceTitle: booking.serviceTitle || "",
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: payableAmount,
      customerName,
      customerEmail,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const confirmCardPayment = async (req, res) => {
  try {
    const { bookingId, paymentIntentId } = req.body;
    if (!bookingId || !paymentIntentId) {
      return res
        .status(400)
        .json({ message: "bookingId and paymentIntentId are required" });
    }
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid bookingId" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.customerEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your booking" });
    }

    const intent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ["latest_charge"],
    });

    if (intent.status !== "succeeded") {
      return res
        .status(400)
        .json({ message: `Payment not completed (${intent.status})` });
    }

    await ensureLegacySessionIndexDropped();

    const billingDetails = intent.latest_charge?.billing_details || {};
    const resolvedCustomerName =
      billingDetails.name ||
      booking.customerName ||
      intent.metadata?.customerName ||
      req.user.name ||
      "Customer";
    const resolvedCustomerEmail =
      billingDetails.email ||
      booking.customerEmail ||
      intent.metadata?.customerEmail ||
      req.user.email;

    const existingPayment = await Payment.findOne({
      $or: [
        { transactionId: intent.id },
        { stripePaymentIntentId: intent.id },
        { bookingId: booking._id.toString() },
      ],
    });

    if (!existingPayment) {
      const payment = new Payment({
        bookingId: booking._id.toString(),
        serviceTitle:
          booking.serviceTitle ||
          intent.metadata?.serviceTitle ||
          "Repair Service",
        customerName: resolvedCustomerName,
        customerEmail: resolvedCustomerEmail,
        technicianName:
          booking.technicianName || intent.metadata?.technicianName || "",
        technicianEmail:
          booking.technicianEmail || intent.metadata?.technicianEmail || "",
        amount: intent.amount / 100,
        currency: intent.currency || "usd",
        transactionId: intent.id,
        stripePaymentIntentId: intent.id,
        paymentStatus: "paid",
        paidAt: new Date(),
      });
      await payment.save();
    }

    if (booking.paymentStatus !== "paid") {
      booking.paymentStatus = "paid";
      await booking.save();
    }

    res.status(200).json({
      message: "Payment verified and recorded successfully",
      transactionId: intent.id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Valid bookingId is required" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (booking.customerEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your booking" });
    }
    if (booking.status !== "completed" || booking.paymentStatus === "paid") {
      return res
        .status(400)
        .json({ message: "Payment not allowed for this booking" });
    }

    const payableAmount = Number(booking.finalAmount ?? booking.basePrice ?? 0);
    if (!payableAmount || payableAmount <= 0) {
      return res.status(400).json({ message: "Invalid booking amount" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: booking.customerEmail || req.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: booking.serviceTitle || "Repair Service" },
            unit_amount: Math.round(payableAmount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        bookingId: booking._id.toString(),
        customerEmail: req.user.email,
        technicianName: booking.technicianName || "",
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ message: "session_id is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const bookingId = session.metadata?.bookingId;
    if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({ message: "Invalid booking metadata" });
    }

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    if (req.user?.email && booking.customerEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your booking" });
    }

    const existingPayment = await Payment.findOne({
      $or: [
        { stripeSessionId: session.id },
        { transactionId: session.payment_intent },
        { bookingId: booking._id.toString() },
      ],
    });

    if (!existingPayment) {
      const payment = new Payment({
        bookingId: booking._id.toString(),
        serviceTitle: booking.serviceTitle,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        technicianName: booking.technicianName,
        technicianEmail: booking.technicianEmail,
        amount: session.amount_total / 100,
        transactionId: session.payment_intent,
        stripeSessionId: session.id,
        paymentStatus: "paid",
        paidAt: new Date(),
      });
      await payment.save();
    }

    if (booking.paymentStatus !== "paid") {
      booking.paymentStatus = "paid";
      await booking.save();
    }

    res.status(200).json({
      message: "Payment verified successfully",
      transactionId: session.payment_intent,
      amount: session.amount_total / 100,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCustomerPayments = async (req, res) => {
  try {
    const payments = await Payment.find({
      customerEmail: req.user.email,
    }).sort({ paidAt: -1 });
    res.status(200).json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPaymentIntent,
  confirmCardPayment,
  createCheckoutSession,
  verifyPayment,
  getCustomerPayments,
};