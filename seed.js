const mongoose = require('mongoose');
require('dotenv').config();
const Service = require('./src/models/Service');
const Booking = require('./src/models/Booking');

// আপনার দেওয়া টেকনিশিয়ানদের ইমেইল ও নাম
const tech1 = { name: "Technician", email: "technician@gmail.com" };
const tech2 = { name: "Technician 02", email: "technician02@gmail.com" };
const customer = { name: "Customer", email: "customer@gmail.com" };

const seedServices = [
  // Technician 1 (technician@gmail.com)
  { title: "iPhone Screen Replacement", category: "Smartphone", description: "Premium quality screen replacement for all iPhone models with 3 months warranty.", image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?q=80&w=800", basePrice: 49, estimatedDuration: "1-2 hours", serviceMode: "Home Visit", serviceArea: "Dhanmondi, Dhaka", technicianName: tech1.name, technicianEmail: tech1.email, approvalStatus: "approved" },
  { title: "MacBook Pro Battery Repair", category: "Laptop & PC", description: "Genuine battery replacement with 6 months warranty.", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800", basePrice: 89, estimatedDuration: "2-3 hours", serviceMode: "Shop Drop-off", serviceArea: "Mirpur, Dhaka", technicianName: tech1.name, technicianEmail: tech1.email, approvalStatus: "approved" },
  { title: "AC Servicing & Gas Refill", category: "AC", description: "Complete AC servicing including gas refill and deep cleaning.", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800", basePrice: 35, estimatedDuration: "1 hour", serviceMode: "Home Visit", serviceArea: "Uttara, Dhaka", technicianName: tech1.name, technicianEmail: tech1.email, approvalStatus: "approved" },
  { title: "Refrigerator Cooling Issue", category: "Refrigerator", description: "Fix cooling issues, gas leaks, and compressor problems.", image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?q=80&w=800", basePrice: 55, estimatedDuration: "2 hours", serviceMode: "Home Visit", serviceArea: "Gulshan, Dhaka", technicianName: tech1.name, technicianEmail: tech1.email, approvalStatus: "approved" },
  { title: "Washing Machine Motor Fix", category: "Washing Machine", description: "Motor repair and replacement for all top and front load brands.", image: "https://images.unsplash.com/photo-1626806819282-2c1dc01a5e0c?q=80&w=800", basePrice: 40, estimatedDuration: "1-2 hours", serviceMode: "Shop Drop-off", serviceArea: "Banani, Dhaka", technicianName: tech1.name, technicianEmail: tech1.email, approvalStatus: "approved" },
  { title: "Smart TV Screen Repair", category: "TV", description: "Screen replacement and display issue fixing for LED, OLED, QLED.", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800", basePrice: 75, estimatedDuration: "3 hours", serviceMode: "Home Visit", serviceArea: "Mohakhali, Dhaka", technicianName: tech1.name, technicianEmail: tech1.email, approvalStatus: "approved" },

  // Technician 2 (technician02@gmail.com)
  { title: "Electrical Wiring Fix", category: "Electrical", description: "Fix short circuits, wiring issues, and switchboards safely.", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?q=80&w=800", basePrice: 30, estimatedDuration: "1 hour", serviceMode: "Home Visit", serviceArea: "Dhanmondi, Dhaka", technicianName: tech2.name, technicianEmail: tech2.email, approvalStatus: "approved" },
  { title: "Laptop Keyboard Replacement", category: "Laptop & PC", description: "Replace broken laptop keyboards with original parts.", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800", basePrice: 45, estimatedDuration: "1 day", serviceMode: "Shop Drop-off", serviceArea: "Mirpur, Dhaka", technicianName: tech2.name, technicianEmail: tech2.email, approvalStatus: "approved" },
  { title: "Smartphone Battery Replacement", category: "Smartphone", description: "Fast battery draining fix with genuine high-capacity battery.", image: "https://images.unsplash.com/photo-1603314585442-ee3b3c16fbcf?q=80&w=800", basePrice: 25, estimatedDuration: "30 mins", serviceMode: "Home Visit", serviceArea: "Gulshan, Dhaka", technicianName: tech2.name, technicianEmail: tech2.email, approvalStatus: "approved" },
  { title: "AC Installation", category: "AC", description: "New AC installation and setup with proper piping.", image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=800", basePrice: 60, estimatedDuration: "2 hours", serviceMode: "Home Visit", serviceArea: "Uttara, Dhaka", technicianName: tech2.name, technicianEmail: tech2.email, approvalStatus: "approved" },
  { title: "TV Wall Mount Setup", category: "TV", description: "Professional TV wall mount installation and cable management.", image: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=800", basePrice: 20, estimatedDuration: "1 hour", serviceMode: "Home Visit", serviceArea: "Banani, Dhaka", technicianName: tech2.name, technicianEmail: tech2.email, approvalStatus: "approved" },
  { title: "Refrigerator Gas Refill", category: "Refrigerator", description: "Refrigerator gas top-up and leak check for all models.", image: "https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?q=80&w=800", basePrice: 40, estimatedDuration: "1 hour", serviceMode: "Shop Drop-off", serviceArea: "Mohakhali, Dhaka", technicianName: tech2.name, technicianEmail: tech2.email, approvalStatus: "approved" },
];

const seedBookings = [
  { status: "requested", paymentStatus: "unpaid" },
  { status: "in-progress", paymentStatus: "unpaid" },
  { status: "completed", paymentStatus: "unpaid" },
  { status: "completed", paymentStatus: "paid" }
];

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to DB. Seeding...");
    
    // ১. সার্ভিস ডিলিট ও ইনসার্ট
    await Service.deleteMany({});
    const insertedServices = await Service.insertMany(seedServices);
    console.log(`✅ Successfully seeded ${insertedServices.length} services!`);

    // ২. কিছু ডামি বুকিং তৈরি করা (যাতে ড্যাশবোর্ড খালি না লাগে)
    await Booking.deleteMany({});
    const bookingsToInsert = insertedServices.slice(0, 4).map((service, index) => ({
      serviceId: service._id.toString(),
      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,
      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,
      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: "+880 1234 567890",
      address: "Dhanmondi, Dhaka",
      preferredDate: new Date(new Date().setDate(new Date().getDate() + index + 1)),
      problemDescription: "My device is not working properly. Please fix it as soon as possible.",
      status: seedBookings[index].status,
      paymentStatus: seedBookings[index].paymentStatus,
      finalAmount: seedBookings[index].status === 'completed' ? service.basePrice : undefined,
    }));

    await Booking.insertMany(bookingsToInsert);
    console.log(`✅ Successfully seeded ${bookingsToInsert.length} bookings!`);

    console.log("🎉 Seed data completed successfully!");
    process.exit();
  })
  .catch((err) => {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  });