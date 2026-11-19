const express = require('express');
const router = express.Router();
const { getAllUsers, updateUserRole, updateServiceApproval, getAllBookings, getAllPayments, getAllServices, getAdminStats } = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');

router.use(verifyToken, verifyAdmin);

router.get('/users', getAllUsers);
router.patch('/users/:id/role', updateUserRole);
router.get('/services', getAllServices);
router.patch('/services/:id/approval', updateServiceApproval);
router.get('/bookings', getAllBookings);
router.get('/payments', getAllPayments);
router.get('/stats', getAdminStats);

module.exports = router;