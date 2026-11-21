const User = require('../models/User');
const Booking = require('../models/Booking');

// Get Top Technicians for Home Page
const getTopTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).limit(4);

    const formattedTechs = technicians.map((tech) => ({
      _id: tech._id,
      name: tech.name,
      skill: tech.bio || "Verified Technician",
      location: tech.area || "Dhaka, Bangladesh",
      image:
        tech.image ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(
          tech.name
        )}&background=ff5722&color=fff&bold=true`,
      rating: 4.8,
      reviews: 120,
      plan: tech.plan === 'pro' ? 'pro' : 'free',
      isVerifiedPro: Boolean(tech.isVerifiedPro),
    }));

    res.status(200).json(formattedTechs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Reviews for Marquee Section
const getPublicReviews = async (req, res) => {
  try {
    const reviews = await Booking.find({
      paymentStatus: 'paid',
      review: { $exists: true, $ne: "" },
    })
      .sort({ updatedAt: -1 })
      .limit(10);

    const formattedReviews = reviews.map((r) => ({
      text: r.review,
      author: r.customerName,
      role: "Customer",
      icon: "Star",
    }));

    res.status(200).json(formattedReviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getTopTechnicians, getPublicReviews };