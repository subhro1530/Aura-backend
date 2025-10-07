const router = require("express").Router();
const { auth } = require("../middleware/auth");
const { moodEnabled } = require("../middleware/moodEnabled");
const ctrl = require("../controllers/mood.controller");

router.post("/analyze-text", auth, moodEnabled, ctrl.analyzeText);
router.post("/analyze-image", auth, moodEnabled, ctrl.analyzeImage);
router.post("/analyze-video", auth, moodEnabled, ctrl.analyzeVideo);
router.get("/analyze-feed", auth, moodEnabled, ctrl.analyzeFeed);
router.get("/current", auth, moodEnabled, ctrl.currentMood);
router.post("/update", auth, moodEnabled, ctrl.updateMood);
router.get("/trends", auth, moodEnabled, ctrl.trends);
router.get("/summary/weekly", auth, moodEnabled, ctrl.weeklySummary);

module.exports = router;
