const router = require("express").Router();
const { auth } = require("../middleware/auth");
const ctrl = require("../controllers/dm.controller");

router.post("/thread", auth, ctrl.createThread);
router.get("/threads", auth, ctrl.listThreads);
router.get("/threads/:id/messages", auth, ctrl.listMessages);
router.post("/threads/:id/message", auth, ctrl.sendMessage);
router.post("/threads/:id/read", auth, ctrl.markRead);
router.post("/threads/:id/typing", auth, ctrl.typing);
router.post("/threads/:id/add", auth, ctrl.addMember); // body: { userId }
router.post("/threads/:id/remove/:userId", auth, ctrl.removeMember);

module.exports = router;
