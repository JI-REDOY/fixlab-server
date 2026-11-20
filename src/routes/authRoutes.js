const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { verifyToken } = require('../middlewares/auth');

router.post('/jwt', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // BetterAuth-এর ডিফল্ট কালেকশন হলো 'user' (সিঙ্গুলার)
    const db = mongoose.connection.db;
    const user = await db.collection('user').findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found in database' });
    }

    // আগে থেকে তৈরি বা অ্যাডমিন ইউজারের ক্ষেত্রে roleConfirmed undefined থাকলে false ধরি;
    // নতুন Google ইউজার role সিলেক্ট করলে roleConfirmed: true হয়ে যাবে।
    const roleConfirmed = Boolean(user.roleConfirmed);

    const payload = {
      email: user.email,
      role: user.role || 'customer',
      roleConfirmed,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({
      token,
      user: {
        email: user.email,
        role: user.role || 'customer',
        roleConfirmed,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/me', verifyToken, async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const user = await db
      .collection('user')
      .findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image || null,
        role: user.role || 'customer',
        roleConfirmed: Boolean(user.roleConfirmed),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/role', verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ['customer', 'technician'];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: 'Invalid role. Choose either customer or technician.',
      });
    }

    const db = mongoose.connection.db;
    const existingUser = await db
      .collection('user')
      .findOne({ email: req.user.email });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (existingUser.role === 'admin') {
      return res.status(403).json({
        message: 'Admin role cannot be changed through self-selection.',
      });
    }

    await db.collection('user').updateOne(
      { email: req.user.email },
      {
        $set: {
          role,
          roleConfirmed: true,
          updatedAt: new Date(),
        },
      }
    );

    const updatedPayload = {
      email: existingUser.email,
      role,
      roleConfirmed: true,
      name: existingUser.name,
    };

    const token = jwt.sign(updatedPayload, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(200).json({
      message: `Role updated to ${role}`,
      role,
      roleConfirmed: true,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;