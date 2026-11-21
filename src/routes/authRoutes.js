const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { verifyToken } = require("../middlewares/auth");

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

router.post("/jwt", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    if (!process.env.JWT_SECRET) {
      return res
        .status(500)
        .json({ message: "Server configuration error: JWT_SECRET missing" });
    }

    const db = mongoose.connection.db;
    const user = await db.collection("user").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    const roleConfirmed = Boolean(user.roleConfirmed);
    const role = user.role || "customer";

    const payload = {
      email: user.email,
      role,
      roleConfirmed,
      name: user.name,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.status(200).json({
      token,
      user: {
        email: user.email,
        role,
        roleConfirmed,
        name: user.name,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", verifyToken, async (req, res) => {
  try {
    const email = normalizeEmail(req.user?.email);
    const db = mongoose.connection.db;
    const user = await db.collection("user").findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        image: user.image || null,
        role: user.role || "customer",
        roleConfirmed: Boolean(user.roleConfirmed),
        phone: user.phone || "",
        area: user.area || "",
        bio: user.bio || "",
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/role", verifyToken, async (req, res) => {
  try {
    const { role } = req.body;
    const allowedRoles = ["customer", "technician"];

    if (!role || !allowedRoles.includes(role)) {
      return res.status(400).json({
        message: "Invalid role. Choose either customer or technician.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res
        .status(500)
        .json({ message: "Server configuration error: JWT_SECRET missing" });
    }

    const email = normalizeEmail(req.user?.email);
    const db = mongoose.connection.db;
    const existingUser = await db.collection("user").findOne({ email });

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (existingUser.role === "admin") {
      return res.status(403).json({
        message: "Admin role cannot be changed through self-selection.",
      });
    }

    await db.collection("user").updateOne(
      { email },
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
      expiresIn: "7d",
    });

    res.status(200).json({
      message: `Role updated to ${role}`,
      role,
      roleConfirmed: true,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;