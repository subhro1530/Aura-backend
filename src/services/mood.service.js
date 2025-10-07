const gemini = require("./gemini.service");
const logger = require("../config/logger");

async function analyzeText(userId, text) {
  if (!gemini || typeof gemini.analyzeTextMood !== "function") {
    logger.error("analyzeTextMood unavailable", {
      exportedKeys: Object.keys(gemini || {}),
    });
    throw new Error("Mood analysis service not initialized");
  }
  const result = await gemini.analyzeTextMood(text);
  return { userId, ...result };
}

async function analyzeImage(userId, _fileBuffer) {
  if (!gemini || typeof gemini.analyzeImageMood !== "function") {
    logger.error("analyzeImageMood unavailable");
    throw new Error("Mood image analysis service not initialized");
  }
  const result = await gemini.analyzeImageMood(_fileBuffer);
  return { userId, ...result };
}

async function analyzeVideo() {
  return { message: "Video mood analysis not implemented" };
}

async function personalizedFeed(userId) {
  return { userId, items: [], message: "Feed personalization pending" };
}

async function currentMood(userId) {
  return { userId, mood: "neutral", confidence: 0.0 };
}

async function updateMood(userId, mood) {
  return { userId, mood, source: "manual" };
}

async function trends() {
  return { trends: [] };
}

async function weeklySummary(userId) {
  return { userId, summary: [], visualization: null };
}

module.exports = {
  analyzeText,
  analyzeImage,
  analyzeVideo,
  personalizedFeed,
  currentMood,
  updateMood,
  trends,
  weeklySummary,
};
