const router = require("express").Router();
const { auth } = require("../middleware/auth");
const ctrl = require("../controllers/posts.controller");

// Order matters for static paths first
router.get("/feed", auth, ctrl.feed);
router.get("/trending", auth, ctrl.trending);
router.get("/vibe-match", auth, ctrl.vibeMatchPreview);
router.get("/saved", auth, ctrl.getSaved);

router.post("/create", auth, ctrl.create);
router.get("/user/:userId", auth, ctrl.byUser);
router.get("/:id", auth, ctrl.getOne);
router.post("/like/:id", auth, ctrl.likeToggle);
router.post("/comment/:id", auth, ctrl.comment);
router.get("/comments/:id", auth, ctrl.comments);
router.delete("/delete/:id", auth, ctrl.deletePost);
router.post("/share/:id", auth, ctrl.share);
router.post("/save/:id", auth, ctrl.saveToggle);
router.post("/report/:id", auth, ctrl.report);

module.exports = router;
