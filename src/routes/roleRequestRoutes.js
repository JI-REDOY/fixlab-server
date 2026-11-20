const express = require('express');
const router = express.Router();
const RoleRequest = require('../models/RoleRequest');
const User = require('../models/User');
const { verifyToken, verifyAdmin } = require('../middlewares/auth');

// Current user's latest role request
router.get('/my', verifyToken, async (req, res) => {
  try {
    const email = req.user.email?.toLowerCase();
    const requestDoc = await RoleRequest.findOne({ userEmail: email }).sort({
      createdAt: -1,
    });
    res.status(200).json({ request: requestDoc || null });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to load your role request', error: error.message });
  }
});

// Get all role requests (Admin only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const requests = await RoleRequest.find().sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to load role requests', error: error.message });
  }
});

// Create a role change request (Authenticated user)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { requestedRole, reason } = req.body;
    if (!['customer', 'technician'].includes(requestedRole)) {
      return res.status(400).json({ message: 'Invalid requested role' });
    }

    const email = req.user.email?.toLowerCase();

    const existingPending = await RoleRequest.findOne({
      userEmail: email,
      status: 'pending',
    });

    if (existingPending) {
      return res
        .status(400)
        .json({ message: 'You already have a pending role request' });
    }

    const dbUser = await User.findOne({ email });
    const currentRole = dbUser?.role || req.user.role || 'customer';

    if (currentRole === 'admin') {
      return res
        .status(403)
        .json({ message: 'Admin role cannot request a role change' });
    }

    if (currentRole === requestedRole) {
      return res
        .status(400)
        .json({ message: `Your role is already ${requestedRole}` });
    }

    const requestDoc = await RoleRequest.create({
      userName: dbUser?.name || req.user.name || req.user.email,
      userEmail: email,
      currentRole,
      requestedRole,
      reason: typeof reason === 'string' ? reason.trim() : '',
      status: 'pending',
    });

    res
      .status(201)
      .json({ message: 'Role request submitted', request: requestDoc });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to submit role request', error: error.message });
  }
});

// Approve or reject role request (Admin only)
router.patch('/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Status must be approved or rejected' });
    }

    const roleReq = await RoleRequest.findById(req.params.id);
    if (!roleReq) {
      return res.status(404).json({ message: 'Role request not found' });
    }

    roleReq.status = status;
    if (typeof adminNote === 'string') {
      roleReq.adminNote = adminNote.trim();
    }
    roleReq.reviewedBy = req.user.email || '';
    roleReq.reviewedAt = new Date();
    await roleReq.save();

    if (status === 'approved') {
      await User.findOneAndUpdate(
        { email: roleReq.userEmail.toLowerCase() },
        {
          role: roleReq.requestedRole,
          roleConfirmed: true,
        },
        { new: true }
      );
    }

    res.status(200).json({ message: `Request ${status}`, request: roleReq });
  } catch (error) {
    res
      .status(500)
      .json({ message: 'Failed to update role request', error: error.message });
  }
});

module.exports = router;