const moodService = require("../services/mood.service");

async function analyzeText(req, res, next) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "Text required" });
    const r = await moodService.analyzeText(req.user.id, text);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function analyzeImage(req, res, next) {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64)
      return res.status(400).json({ error: "imageBase64 required" });
    const buf = Buffer.from(imageBase64, "base64");
    const r = await moodService.analyzeImage(req.user.id, buf);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function analyzeVideo(req, res, next) {
  try {
    const r = await moodService.analyzeVideo();
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function analyzeFeed(req, res, next) {
  try {
    const r = await moodService.personalizedFeed(req.user.id);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function currentMood(req, res, next) {
  try {
    const r = await moodService.currentMood(req.user.id);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function updateMood(req, res, next) {
  try {
    const { mood } = req.body;
    if (!mood) return res.status(400).json({ error: "mood required" });
    const r = await moodService.updateMood(req.user.id, mood);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function trends(req, res, next) {
  try {
    const r = await moodService.trends();
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function weeklySummary(req, res, next) {
  try {
    const r = await moodService.weeklySummary(req.user.id);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  analyzeText,
  analyzeImage,
  analyzeVideo,
  analyzeFeed,
  currentMood,
  updateMood,
  trends,
  weeklySummary,
};
