const router = require("express").Router();
const ctrl = require("../controllers/user.controller");
const { auth } = require("../middleware/auth");

router.get("/profile/:id", auth, ctrl.getProfile);
router.put("/profile/update", auth, ctrl.updateProfile);
router.delete("/delete", auth, ctrl.deleteAccount);
router.post("/block/:id", auth, ctrl.blockUser);
router.post("/report/:id", auth, ctrl.reportUser);
router.put("/preferences", auth, ctrl.updatePreferences);

module.exports = router;
