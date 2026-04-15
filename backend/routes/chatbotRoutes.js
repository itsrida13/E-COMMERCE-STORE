const express = require("express");
const router = express.Router();
const { handleChatRequest } = require("../controllers/chatbotController");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Optional auth middleware for chatbot (allows anonymous and logged in)
const optionalAuth = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select("-password");
    } catch (error) {
      // ignore invalid tokens for chatbot
    }
  }
  next();
};

router.post("/", optionalAuth, handleChatRequest);

module.exports = router;
