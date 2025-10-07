const router = require("express").Router();
const { auth } = require("../middleware/auth");
const ctrl = require("../controllers/search.controller");

// Unified (auto-detect @ / # / general)
router.get("/", auth, ctrl.unified);

// Explicit
router.get("/users", auth, ctrl.users);
router.get("/posts", auth, ctrl.posts);
router.get("/suggest", auth, ctrl.suggest);

module.exports = router;
