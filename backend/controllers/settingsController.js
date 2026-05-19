const Setting = require("../models/Setting");

// Get settings (returns single settings document or creates a default one if it doesn't exist)
exports.getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting();
      await settings.save();
    }
    res.status(200).json(settings);
  } catch (err) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
};

// Update settings (updates existing settings document or creates a new one with payload if none exist)
exports.updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting(req.body);
    } else {
      // Safely assign all keys from payload
      Object.assign(settings, req.body);
    }
    await settings.save();
    res.status(200).json(settings);
  } catch (err) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: "Failed to update settings" });
  }
};
