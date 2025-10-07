const router = require("express").Router();
const ctrl = require("../controllers/auth.controller");
const { auth } = require("../middleware/auth");

router.post("/register", ctrl.register);
router.post("/login", ctrl.login);
router.post("/logout", auth, ctrl.logout);
router.post("/verify-email", ctrl.verifyEmail);
router.post("/forgot-password", ctrl.forgotPassword);
router.put("/reset-password", ctrl.resetPassword);
router.post("/social-login", ctrl.socialLogin);

module.exports = router;
