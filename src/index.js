const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// CORS Middleware
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ⚠️ Stripe Webhook Route (express.json() এর আগে থাকতে হবে)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      console.log('✅ Checkout Session Completed:', event.data.object);
      // এখানে আপনার ডেটাবেস আপডেট লজিক বসাতে পারেন
      break;
    case 'payment_intent.succeeded':
      console.log('✅ Payment Intent Succeeded:', event.data.object);
      // এখানে আপনার ডেটাবেস আপডেট লজিক বসাতে পারেন
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// JSON Middleware
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const publicRoutes = require("./routes/publicRoutes");
const roleRequestRoutes = require("./routes/roleRequestRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/auth/role-requests", roleRequestRoutes);
app.use("/api/role-requests", roleRequestRoutes);
app.use("/api/services", serviceRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/public", publicRoutes);

app.get("/", (req, res) => {
  res.send("FixLab Server is running perfectly!");
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.message === "Not allowed by CORS" ? 403 : 500;
  res.status(status).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB Connection Error: ", err);
  });