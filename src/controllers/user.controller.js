const userService = require("../services/user.service");
const { validate: uuidValidate } = require("uuid");

async function getProfile(req, res, next) {
  try {
    const raw = req.params.id;
    let profile;
    if (raw === "me") {
      profile = await userService.getProfile(req.user.id);
    } else if (uuidValidate(raw)) {
      profile = await userService.getProfile(raw);
    } else {
      // treat as username
      profile = await userService.getProfileByUsername(raw);
    }
    res.json({ profile });
  } catch (e) {
    next(e);
  }
}

async function updateProfile(req, res, next) {
  try {
    const data = await userService.updateProfile(req.user.id, req.body);
    res.json({ profile: data });
  } catch (e) {
    next(e);
  }
}

async function deleteAccount(req, res, next) {
  try {
    const r = await userService.softDelete(req.user.id);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function blockUser(req, res, next) {
  try {
    const r = await userService.blockUser(req.user.id, req.params.id);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function reportUser(req, res, next) {
  try {
    const r = await userService.reportUser(
      req.user.id,
      req.params.id,
      req.body.reason
    );
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function updatePreferences(req, res, next) {
  try {
    const r = await userService.updatePreferences(req.user.id, req.body);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getProfile,
  updateProfile,
  deleteAccount,
  blockUser,
  reportUser,
  updatePreferences,
};
