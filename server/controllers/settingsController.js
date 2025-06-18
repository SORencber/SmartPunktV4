const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings', details: err.message });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        settings[key] = { ...settings[key], ...req.body[key] };
        settings.markModified(key);
      } else {
        settings[key] = req.body[key];
      }
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings', details: err.message });
  }
}; 