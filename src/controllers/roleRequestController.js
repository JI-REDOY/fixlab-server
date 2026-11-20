const mongoose = require('mongoose');
const RoleRequest = require('../models/RoleRequest');

// ইউজার নতুন role change request পাঠাবে
const createRoleRequest = async (req, res) => {
  try {
    const { requestedRole, reason } = req.body;
    const allowedTargets = ['customer', 'technician'];

    if (!requestedRole || !allowedTargets.includes(requestedRole)) {
      return res.status(400).json({
        message: 'Requested role must be either customer or technician.',
      });
    }

    const db = mongoose.connection.db;
    const dbUser = await db
      .collection('user')
      .findOne({ email: req.user.email });

    if (!dbUser) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const currentRole = dbUser.role || 'customer';

    if (currentRole === 'admin') {
      return res.status(403).json({
        message: 'Admin cannot submit role change requests.',
      });
    }

    if (currentRole === requestedRole) {
      return res.status(400).json({
        message: `You already have the ${requestedRole} role.`,
      });
    }

    const existingPending = await RoleRequest.findOne({
      userEmail: req.user.email,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(409).json({
        message: 'You already have a pending role change request.',
      });
    }

    const created = await RoleRequest.create({
      userEmail: req.user.email,
      userName: dbUser.name || req.user.name || 'User',
      currentRole,
      requestedRole,
      reason: typeof reason === 'string' ? reason.trim() : '',
      status: 'pending',
    });

    res.status(201).json({
      message: 'Role change request submitted successfully.',
      request: created,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create role request.' });
  }
};

// বর্তমান ইউজারের সর্বশেষ role request দেখাবে
const getMyRoleRequest = async (req, res) => {
  try {
    const request = await RoleRequest.findOne({ userEmail: req.user.email })
      .sort({ createdAt: -1 });

    res.status(200).json({ request: request || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load role request.' });
  }
};

// অ্যাডমিন সব role request দেখবে
const getAllRoleRequests = async (req, res) => {
  try {
    const requests = await RoleRequest.find().sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to load role requests.' });
  }
};

// অ্যাডমিন role request approve বা reject করবে
const reviewRoleRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNote } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be either approved or rejected.',
      });
    }

    const roleRequest = await RoleRequest.findById(id);
    if (!roleRequest) {
      return res.status(404).json({ message: 'Role request not found.' });
    }

    if (roleRequest.status !== 'pending') {
      return res.status(400).json({
        message: `This request is already ${roleRequest.status}.`,
      });
    }

    if (status === 'approved') {
      const db = mongoose.connection.db;
      await db.collection('user').updateOne(
        { email: roleRequest.userEmail },
        {
          $set: {
            role: roleRequest.requestedRole,
            roleConfirmed: true,
            updatedAt: new Date(),
          },
        }
      );
    }

    roleRequest.status = status;
    roleRequest.adminNote = typeof adminNote === 'string' ? adminNote.trim() : '';
    roleRequest.reviewedBy = req.user.email;
    roleRequest.reviewedAt = new Date();
    await roleRequest.save();

    res.status(200).json({
      message: `Role request ${status}.`,
      request: roleRequest,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to review role request.' });
  }
};

module.exports = {
  createRoleRequest,
  getMyRoleRequest,
  getAllRoleRequests,
  reviewRoleRequest,
};