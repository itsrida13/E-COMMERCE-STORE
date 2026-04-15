const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const INVALID_CREDENTIALS = "Invalid email or password";

// POST /api/auth/admin/register
router.post("/admin/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const nameTrimmed = String(name).trim();
    if (nameTrimmed.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }
    if (nameTrimmed.length > 50) {
      return res.status(400).json({ error: "Name is too long" });
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    if (!emailTrimmed) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!EMAIL_REGEX.test(emailTrimmed)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const existing = await User.findOne({ email: emailTrimmed });
    if (existing) {
      return res.status(400).json({ error: "Email already registered. Please login." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: nameTrimmed,
      email: emailTrimmed,
      password: hashedPassword,
      role: "admin", // FORCE ADMIN ROLE
    });

    const savedUser = await user.save();

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already registered. Please login." });
    }
    console.error("Admin Register error:", err);
    res.status(500).json({ error: "Admin Registration failed. Please try again." });
  }
});

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email and password are required" });
    }

    const nameTrimmed = String(name).trim();
    if (nameTrimmed.length < 2) {
      return res.status(400).json({ error: "Name must be at least 2 characters" });
    }
    if (nameTrimmed.length > 50) {
      return res.status(400).json({ error: "Name is too long" });
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    if (!emailTrimmed) {
      return res.status(400).json({ error: "Email is required" });
    }
    if (!EMAIL_REGEX.test(emailTrimmed)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: "Password is too long" });
    }

    const existing = await User.findOne({ email: emailTrimmed });
    if (existing) {
      return res.status(400).json({ error: "Email already registered. Please login." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name: nameTrimmed,
      email: emailTrimmed,
      password: hashedPassword,
    });

    const savedUser = await user.save();

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: savedUser._id, role: savedUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Email already registered. Please login." });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const emailTrimmed = String(email).trim().toLowerCase();
    if (!EMAIL_REGEX.test(emailTrimmed)) {
      return res.status(400).json({ error: "Please enter a valid email address" });
    }

    const user = await User.findOne({ email: emailTrimmed }).select("+password");
    if (!user) {
      return res.status(401).json({ error: INVALID_CREDENTIALS });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: INVALID_CREDENTIALS });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: "Server configuration error" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

module.exports = router;
