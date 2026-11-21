const mongoose = require("mongoose");
const Service = require("../models/Service");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// Create a new service (Technician only)
const createService = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      image,
      basePrice,
      estimatedDuration,
      serviceMode,
      serviceArea,
    } = req.body;

    if (
      !title ||
      !category ||
      !description ||
      !image ||
      basePrice === undefined ||
      !estimatedDuration ||
      !serviceMode ||
      !serviceArea
    ) {
      return res.status(400).json({ message: "All service fields are required" });
    }

    const numericPrice = Number(basePrice);
    if (Number.isNaN(numericPrice) || numericPrice <= 0) {
      return res
        .status(400)
        .json({ message: "Base price must be a positive number" });
    }

    const newService = new Service({
      title: String(title).trim(),
      category: String(category).trim(),
      description: String(description).trim(),
      image: String(image).trim(),
      basePrice: numericPrice,
      estimatedDuration: String(estimatedDuration).trim(),
      serviceMode: String(serviceMode).trim(),
      serviceArea: String(serviceArea).trim(),
      technicianName: req.user.name,
      technicianEmail: req.user.email,
      approvalStatus: "pending",
      isAvailable: true,
    });

    await newService.save();
    res
      .status(201)
      .json({ message: "Service created successfully", service: newService });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all approved services with Search, Filter, Sort (Challenge 1)
const getPublicServices = async (req, res) => {
  try {
    const { search, category, serviceMode, sort } = req.query;
    const query = { approvalStatus: "approved", isAvailable: true };

    if (search && String(search).trim()) {
      const trimmedSearch = String(search).trim();
      query.$or = [
        { title: { $regex: trimmedSearch, $options: "i" } },
        { category: { $regex: trimmedSearch, $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      query.category = category;
    }

    if (serviceMode && serviceMode !== "All") {
      query.serviceMode = serviceMode;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price-low") sortOption = { basePrice: 1 };
    if (sort === "price-high") sortOption = { basePrice: -1 };

    const services = await Service.find(query).sort(sortOption);
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get services of logged-in technician
const getTechnicianServices = async (req, res) => {
  try {
    const services = await Service.find({
      technicianEmail: req.user.email,
    }).sort({ createdAt: -1 });
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update service (Technician only) - resets approval to pending
const updateService = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (service.technicianEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your service" });
    }

    const {
      title,
      category,
      description,
      image,
      basePrice,
      estimatedDuration,
      serviceMode,
      serviceArea,
      isAvailable,
    } = req.body;

    const updateData = {};
    if (title !== undefined) updateData.title = String(title).trim();
    if (category !== undefined) updateData.category = String(category).trim();
    if (description !== undefined)
      updateData.description = String(description).trim();
    if (image !== undefined) updateData.image = String(image).trim();
    if (basePrice !== undefined) {
      const numericPrice = Number(basePrice);
      if (Number.isNaN(numericPrice) || numericPrice <= 0) {
        return res
          .status(400)
          .json({ message: "Base price must be a positive number" });
      }
      updateData.basePrice = numericPrice;
    }
    if (estimatedDuration !== undefined)
      updateData.estimatedDuration = String(estimatedDuration).trim();
    if (serviceMode !== undefined)
      updateData.serviceMode = String(serviceMode).trim();
    if (serviceArea !== undefined)
      updateData.serviceArea = String(serviceArea).trim();
    if (typeof isAvailable === "boolean") {
      updateData.isAvailable = isAvailable;
    }

    const isContentEdited = [
      title,
      category,
      description,
      image,
      basePrice,
      estimatedDuration,
      serviceMode,
      serviceArea,
    ].some((val) => val !== undefined);

    if (isContentEdited) {
      updateData.approvalStatus = "pending";
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res
      .status(200)
      .json({ message: "Service updated successfully", service: updatedService });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete service (Technician only)
const deleteService = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ message: "Service not found" });
    }
    if (service.technicianEmail !== req.user.email) {
      return res.status(403).json({ message: "Forbidden: Not your service" });
    }

    await Service.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Service deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get featured services (Latest 6)
const getFeaturedServices = async (req, res) => {
  try {
    const services = await Service.find({
      approvalStatus: "approved",
      isAvailable: true,
    })
      .sort({ createdAt: -1 })
      .limit(6);
    res.status(200).json(services);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get single service by ID
const getServiceById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid service ID" });
    }

    const service = await Service.findById(req.params.id);
    if (
      !service ||
      service.approvalStatus !== "approved" ||
      !service.isAvailable
    ) {
      return res.status(404).json({ message: "Service not found" });
    }

    res.status(200).json(service);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createService,
  getPublicServices,
  getTechnicianServices,
  updateService,
  deleteService,
  getFeaturedServices,
  getServiceById,
};