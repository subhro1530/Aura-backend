const service = require("../services/posts.service");
const { validate: uuidValidate } = require("uuid");

function asUUIDOrNull(v) {
  if (v === "me") return null;
  return uuidValidate(v) ? v : null;
}

async function create(req, res, next) {
  try {
    const { caption, media_url, media_type, emotion, tags } = req.body;
    const post = await service.create({
      userId: req.user.id,
      caption,
      media_url,
      media_type,
      emotion,
      tags,
    });
    res.status(201).json({ post });
  } catch (e) {
    next(e);
  }
}

async function getOne(req, res, next) {
  try {
    const post = await service.getOne(req.params.id, req.user.id);
    res.json({ post });
  } catch (e) {
    next(e);
  }
}

async function byUser(req, res, next) {
  try {
    const raw = req.params.userId;
    const userId = raw === "me" ? req.user.id : raw;
    const posts = await service.byUser(userId, req.user.id);
    res.json({ posts });
  } catch (e) {
    next(e);
  }
}

async function feed(req, res, next) {
  try {
    const posts = await service.feed(req.user.id);
    res.json({ posts });
  } catch (e) {
    next(e);
  }
}

async function trending(req, res, next) {
  try {
    const posts = await service.trending(req.user.id);
    res.json({ posts });
  } catch (e) {
    next(e);
  }
}

async function likeToggle(req, res, next) {
  try {
    const r = await service.likeToggle(req.user.id, req.params.id);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function comment(req, res, next) {
  try {
    const { content, emotion } = req.body;
    if (!content) return res.status(400).json({ error: "content required" });
    const c = await service.addComment(
      req.user.id,
      req.params.id,
      content,
      emotion
    );
    res.status(201).json({ comment: c });
  } catch (e) {
    next(e);
  }
}

async function comments(req, res, next) {
  try {
    const list = await service.getComments(req.params.id);
    res.json({ comments: list });
  } catch (e) {
    next(e);
  }
}

async function deletePost(req, res, next) {
  try {
    const r = await service.deletePost(req.user.id, req.params.id);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function vibeMatchPreview(req, res, next) {
  try {
    const scores = await service.vibeMatch(req.user.id);
    res.json({ scores });
  } catch (e) {
    next(e);
  }
}

async function share(req, res, next) {
  try {
    const { target_type, circle_id } = req.body;
    const r = await service.share(
      req.user.id,
      req.params.id,
      target_type,
      circle_id
    );
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function saveToggle(req, res, next) {
  try {
    const r = await service.saveToggle(req.user.id, req.params.id);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

async function getSaved(req, res, next) {
  try {
    const posts = await service.getSaved(req.user.id);
    res.json({ posts });
  } catch (e) {
    next(e);
  }
}

async function report(req, res, next) {
  try {
    const { reason } = req.body;
    const r = await service.report(req.user.id, req.params.id, reason);
    res.json(r);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  create,
  getOne,
  byUser,
  feed,
  trending,
  likeToggle,
  comment,
  comments,
  deletePost,
  vibeMatchPreview,
  share,
  saveToggle,
  getSaved,
  report,
};
