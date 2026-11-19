const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post('/jwt', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // BetterAuth-এর ডিফল্ট কালেকশন হলো 'user' (সিঙ্গুলার)।
    // Mongoose-এ আমরা 'User' মডেল বানিয়েছি যা 'users' কালেকশনে খুঁজবে।
    // তাই সরাসরি mongoose.connection.db.collection('user') ব্যবহার করা ভালো।
    
    const db = require('mongoose').connection.db;
    const user = await db.collection('user').findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const payload = {
      email: user.email,
      role: user.role || 'customer',
      name: user.name
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;