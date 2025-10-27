const router = require("express").Router();
const { auth } = require("../middleware/auth");
const ctrl = require("../controllers/profile.controller");

router.put("/username", auth, ctrl.changeUsername);
router.put("/email", auth, ctrl.changeEmail);
router.put("/photo", auth, ctrl.changePhoto);

module.exports = router;
