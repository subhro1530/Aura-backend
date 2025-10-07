const service = require("../services/search.service");

async function unified(req, res, next) {
  try {
    const { q = "", limit, offset } = req.query;
    if (!q.trim()) return res.status(400).json({ error: "q required" });
    let data;
    if (q.startsWith("@")) {
      data = await service.searchUsers(req.user.id, q.slice(1), {
        limit,
        offset,
      });
      return res.json({ type: "users", query: q, results: data });
    } else if (q.startsWith("#")) {
      data = await service.searchPostsByTag(req.user.id, q.slice(1), {
        limit,
        offset,
      });
      return res.json({ type: "posts", mode: "tag", query: q, results: data });
    } else {
      data = await service.searchPosts(req.user.id, q, { limit, offset });
      return res.json({ type: "posts", mode: "text", query: q, results: data });
    }
  } catch (e) {
    next(e);
  }
}

async function users(req, res, next) {
  try {
    const { q = "", limit, offset } = req.query;
    const data = await service.searchUsers(req.user.id, q, { limit, offset });
    res.json({ type: "users", query: q, results: data });
  } catch (e) {
    next(e);
  }
}

async function posts(req, res, next) {
  try {
    const { q = "", limit, offset } = req.query;
    const data = await service.searchPosts(req.user.id, q, { limit, offset });
    res.json({ type: "posts", query: q, results: data });
  } catch (e) {
    next(e);
  }
}

async function suggest(req, res, next) {
  try {
    const { q = "", limit } = req.query;
    const data = await service.suggest(req.user.id, q, { limit });
    res.json({ type: "suggest", query: q, results: data });
  } catch (e) {
    next(e);
  }
}

module.exports = { unified, users, posts, suggest };
