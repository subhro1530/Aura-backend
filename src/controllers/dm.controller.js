const svc = require("../services/dm.service");

async function createThread(req, res, next) {
  try {
    const { participants = [], title } = req.body;
    const r = await svc.createThread(req.user.id, participants, title);
    res.status(201).json(r);
  } catch (e) {
    next(e);
  }
}

async function addMember(req, res, next) {
  try {
    res.json(await svc.addMember(req.params.id, req.body.userId));
  } catch (e) {
    next(e);
  }
}

async function removeMember(req, res, next) {
  try {
    res.json(await svc.removeMember(req.params.id, req.params.userId));
  } catch (e) {
    next(e);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: "content required" });
    const m = await svc.sendMessage(req.params.id, req.user.id, content);
    res.status(201).json({ message: m });
  } catch (e) {
    next(e);
  }
}

async function listThreads(req, res, next) {
  try {
    const { limit, offset } = req.query;
    const r = await svc.listThreads(
      req.user.id,
      Number(limit) || 50,
      Number(offset) || 0
    );
    res.json({ threads: r });
  } catch (e) {
    next(e);
  }
}

async function listMessages(req, res, next) {
  try {
    const { limit, before } = req.query;
    const r = await svc.listMessages(
      req.params.id,
      req.user.id,
      Number(limit) || 50,
      before
    );
    res.json({ messages: r });
  } catch (e) {
    next(e);
  }
}

async function markRead(req, res, next) {
  try {
    res.json(await svc.markRead(req.params.id, req.user.id));
  } catch (e) {
    next(e);
  }
}

// Typing endpoint placeholder (no-op, extend later with WS)
async function typing(_req, res) {
  res.json({ typing: true });
}

module.exports = {
  createThread,
  addMember,
  removeMember,
  sendMessage,
  listThreads,
  listMessages,
  markRead,
  typing,
};
