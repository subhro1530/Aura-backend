const svc = require("../services/social.service");

async function follow(req, res, next) {
  try {
    res.json(await svc.follow(req.user.id, req.params.id));
  } catch (e) {
    next(e);
  }
}
async function unfollow(req, res, next) {
  try {
    res.json(await svc.unfollow(req.user.id, req.params.id));
  } catch (e) {
    next(e);
  }
}
async function followers(req, res, next) {
  try {
    const uid = req.params.id === "me" ? req.user.id : req.params.id;
    const { limit, offset } = req.query;
    res.json({
      followers: await svc.followers(
        uid,
        Number(limit) || 50,
        Number(offset) || 0
      ),
    });
  } catch (e) {
    next(e);
  }
}
async function following(req, res, next) {
  try {
    const uid = req.params.id === "me" ? req.user.id : req.params.id;
    const { limit, offset } = req.query;
    res.json({
      following: await svc.following(
        uid,
        Number(limit) || 50,
        Number(offset) || 0
      ),
    });
  } catch (e) {
    next(e);
  }
}
async function suggestions(req, res, next) {
  try {
    res.json({
      suggestions: await svc.suggestions(
        req.user.id,
        Number(req.query.limit) || 20
      ),
    });
  } catch (e) {
    next(e);
  }
}
async function mutual(req, res, next) {
  try {
    res.json({ mutual: await svc.mutual(req.user.id, req.params.id) });
  } catch (e) {
    next(e);
  }
}
async function status(req, res, next) {
  try {
    res.json(await svc.followStatus(req.user.id, req.params.id));
  } catch (e) {
    next(e);
  }
}

module.exports = {
  follow,
  unfollow,
  followers,
  following,
  suggestions,
  mutual,
  status,
};
