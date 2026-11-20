const User = require('../models/User');
const Booking = require('../models/Booking');

// Get Top Technicians for Home Page
const getTopTechnicians = async (req, res) => {
  try {
    // ডাটাবেস থেকে শুধু টেকনিশিয়ানদের খোঁজা হচ্ছে (সর্বোচ্চ ৪ জন)
    const technicians = await User.find({ role: 'technician' }).limit(4);

    // ফ্রন্টএন্ডের সুবিধার জন্য ডেটা ফরম্যাট করা হলো
    const formattedTechs = technicians.map(tech => ({
      _id: tech._id,
      name: tech.name,
      skill: tech.bio || "Verified Technician",
      location: tech.area || "Dhaka, Bangladesh",
      image: tech.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=ff5722&color=fff&bold=true`,
      rating: 4.8, // ভবিষ্যতে রিয়েল রেটিং ডেটাবেস থেকে আসবে
      reviews: 120
    }));

    res.status(200).json(formattedTechs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Reviews for Marquee Section
const getPublicReviews = async (req, res) => {
  try {
    // ডাটাবেস থেকে শুধু সেই বুকিংগুলো আনা হচ্ছে যেগুলো Paid এবং যেখানে রিভিউ দেওয়া হয়েছে
    const reviews = await Booking.find({ 
      paymentStatus: 'paid', 
      review: { $exists: true, $ne: "" } 
    }).sort({ updatedAt: -1 }).limit(10);

    const formattedReviews = reviews.map(r => ({
      text: r.review,
      author: r.customerName,
      role: "Customer",
      icon: "Star" // ফ্রন্টএন্ডে আইকন ম্যাপ করার জন্য
    }));

    res.status(200).json(formattedReviews);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = { getTopTechnicians, getPublicReviews };