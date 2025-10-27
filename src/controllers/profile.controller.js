const svc = require("../services/profile.service");

async function changeUsername(req, res, next) {
  try {
    const { username } = req.body;
    if (!username) return res.status(400).json({ error: "username required" });
    res.json(await svc.changeUsername(req.user.id, username));
  } catch (e) {
    next(e);
  }
}

async function changeEmail(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email required" });
    res.json(await svc.changeEmail(req.user.id, email));
  } catch (e) {
    next(e);
  }
}

async function changePhoto(req, res, next) {
  try {
    const { profile_pic } = req.body;
    res.json(await svc.changePhoto(req.user.id, profile_pic));
  } catch (e) {
    next(e);
  }
}

module.exports = { changeUsername, changeEmail, changePhoto };
