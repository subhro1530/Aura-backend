const router = require("express").Router();
const { auth } = require("../middleware/auth");
const ctrl = require("../controllers/social.controller");

router.post("/follow/:id", auth, ctrl.follow);
router.post("/unfollow/:id", auth, ctrl.unfollow);
router.get("/followers/:id", auth, ctrl.followers);
router.get("/following/:id", auth, ctrl.following);
router.get("/suggestions", auth, ctrl.suggestions);
router.get("/mutual/:id", auth, ctrl.mutual);
router.get("/follow-status/:id", auth, ctrl.status);

module.exports = router;
