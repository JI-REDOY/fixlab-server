const express = require('express');
const router = express.Router();
const { createService, getPublicServices, getTechnicianServices, updateService, deleteService, getFeaturedServices, getServiceById } = require('../controllers/serviceController');
const { verifyToken, verifyTechnician } = require('../middlewares/auth');

// Public Routes
router.get('/', getPublicServices);

// Protected Routes (Technician only)
router.post('/', verifyToken, verifyTechnician, createService);
router.get('/technician/my-services', verifyToken, verifyTechnician, getTechnicianServices);
router.patch('/:id', verifyToken, verifyTechnician, updateService);
router.delete('/:id', verifyToken, verifyTechnician, deleteService);
router.get('/featured', getFeaturedServices);
router.get('/:id', getServiceById);

module.exports = router;