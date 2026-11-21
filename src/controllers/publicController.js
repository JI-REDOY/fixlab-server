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

    const emails = [
      ...new Set(
        reviews
          .map((r) => String(r.customerEmail || "").trim().toLowerCase())
          .filter(Boolean)
      ),
    ];

    const users = emails.length
      ? await User.find({ email: { $in: emails } }).select("email image")
      : [];

    const userImageMap = new Map(
      users.map((u) => [String(u.email || "").trim().toLowerCase(), u.image || ""])
    );

    const formattedReviews = reviews.map((r) => {
      const emailKey = String(r.customerEmail || "").trim().toLowerCase();
      const customerImg = r.customerImage || userImageMap.get(emailKey) || "";

      return {
        text: r.review,
        author: r.customerName || "Verified Customer",
        role: "Customer",
        rating: r.rating ?? 5.0,
        image: customerImg,
        icon: "Star",
      };
    });

    res.status(200).json(formattedReviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getTopTechnicians, getPublicReviews };