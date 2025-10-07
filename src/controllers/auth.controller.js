const authService = require("../services/auth.service");

async function register(req, res, next) {
  try {
    const { email, username, password } = req.body;
    if (!email || !username || !password)
      return res.status(400).json({ error: "Missing fields" });
    const user = await authService.register({ email, username, password });
    res
      .status(201)
      .json({
        user,
        message: "Registered. Check email for verification token.",
      });
  } catch (e) {
    next(e);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Token required" });
    const r = await authService.verifyEmail(token);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Missing fields" });
    const data = await authService.login({ email, password });
    res.json(data);
  } catch (e) {
    next(e);
  }
}

async function logout(req, res, next) {
  try {
    const r = await authService.logout(req.user.jti);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });
    const r = await authService.forgotPassword(email);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword)
      return res.status(400).json({ error: "Missing fields" });
    const r = await authService.resetPassword(token, newPassword);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function socialLogin(req, res, next) {
  try {
    const r = await authService.socialLogin(req.body);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  socialLogin,
};
