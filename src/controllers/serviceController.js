const Service = require('../models/Service');

// Create a new service (Technician only)
const createService = async (req, res) => {
    try {
        const { title, category, description, image, basePrice, estimatedDuration, serviceMode, serviceArea } = req.body;

        const newService = new Service({
            title, category, description, image, basePrice, estimatedDuration, serviceMode, serviceArea,
            technicianName: req.user.name,
            technicianEmail: req.user.email,
            approvalStatus: 'pending',
            isAvailable: true,
        });

        await newService.save();
        res.status(201).json({ message: 'Service created successfully', service: newService });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all approved services with Search, Filter, Sort (Challenge 1)
const getPublicServices = async (req, res) => {
    try {
        const { search, category, serviceMode, sort } = req.query;
        let query = { approvalStatus: 'approved', isAvailable: true };

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }
        if (category && category !== 'All') query.category = category;
        if (serviceMode && serviceMode !== 'All') query.serviceMode = serviceMode;

        let sortOption = { createdAt: -1 };
        if (sort === 'price-low') sortOption = { basePrice: 1 };
        if (sort === 'price-high') sortOption = { basePrice: -1 };

        const services = await Service.find(query).sort(sortOption);
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get services of logged-in technician
const getTechnicianServices = async (req, res) => {
    try {
        const services = await Service.find({ technicianEmail: req.user.email }).sort({ createdAt: -1 });
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update service (Technician only) - resets approval to pending
const updateService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        if (service.technicianEmail !== req.user.email) return res.status(403).json({ message: 'Unauthorized' });

        const updatedService = await Service.findByIdAndUpdate(
            req.params.id,
            { ...req.body, approvalStatus: 'pending' },
            { new: true }
        );
        res.status(200).json({ message: 'Service updated successfully', service: updatedService });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete service (Technician only)
const deleteService = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        if (service.technicianEmail !== req.user.email) return res.status(403).json({ message: 'Unauthorized' });

        await Service.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Service deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get featured services (Latest 6)
const getFeaturedServices = async (req, res) => {
    try {
        const services = await Service.find({ approvalStatus: 'approved', isAvailable: true })
            .sort({ createdAt: -1 })
            .limit(6);
        res.status(200).json(services);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
// Get single service by ID
const getServiceById = async (req, res) => {
    try {
        const service = await Service.findById(req.params.id);
        if (!service) return res.status(404).json({ message: 'Service not found' });
        res.status(200).json(service);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// module.exports এ getFeaturedServices যোগ করুন
module.exports = { createService, getPublicServices, getTechnicianServices, updateService, deleteService, getFeaturedServices, getServiceById };