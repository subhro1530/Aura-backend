const { query } = require("../config/database");

async function createThread(creatorId, participantIds = [], title) {
  const t = await query(
    "INSERT INTO message_threads (creator_id, title) VALUES ($1,$2) RETURNING id, creator_id, title, created_at",
    [creatorId, title || null]
  );
  const threadId = t.rows[0].id;
  // add creator + unique participants
  const members = Array.from(
    new Set([creatorId, ...participantIds.filter(Boolean)])
  );
  for (const uid of members) {
    await query(
      "INSERT INTO thread_members (thread_id, user_id, role) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING",
      [threadId, uid, uid === creatorId ? "owner" : "member"]
    );
  }
  return { thread: t.rows[0], members };
}

async function addMember(threadId, userId) {
  await query(
    "INSERT INTO thread_members (thread_id, user_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [threadId, userId]
  );
  return { added: true };
}

async function removeMember(threadId, userId) {
  await query("DELETE FROM thread_members WHERE thread_id=$1 AND user_id=$2", [
    threadId,
    userId,
  ]);
  return { removed: true };
}

async function sendMessage(threadId, senderId, content) {
  const m = await query(
    "INSERT INTO messages (thread_id, sender_id, content) VALUES ($1,$2,$3) RETURNING *",
    [threadId, senderId, content]
  );
  return m.rows[0];
}

async function listThreads(userId, limit = 50, offset = 0) {
  const r = await query(
    `SELECT t.id, t.title, t.created_at,
            (SELECT content FROM messages WHERE thread_id=t.id ORDER BY created_at DESC LIMIT 1) AS last_message,
            (SELECT created_at FROM messages WHERE thread_id=t.id ORDER BY created_at DESC LIMIT 1) AS last_message_at
     FROM thread_members tm
     JOIN message_threads t ON t.id=tm.thread_id
     WHERE tm.user_id=$1
     ORDER BY last_message_at DESC NULLS LAST, t.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return r.rows;
}

async function listMessages(threadId, userId, limit = 50, before) {
  // verify membership
  const mem = await query(
    "SELECT 1 FROM thread_members WHERE thread_id=$1 AND user_id=$2",
    [threadId, userId]
  );
  if (!mem.rowCount) throw new Error("Not a member");
  const params = [threadId];
  let where = "";
  if (before) {
    params.push(before);
    where = "AND created_at < $2";
  }
  const r = await query(
    `SELECT * FROM messages WHERE thread_id=$1 ${where}
     ORDER BY created_at DESC
     LIMIT ${limit}`,
    params
  );
  return r.rows;
}

async function markRead(threadId, userId) {
  await query(
    "UPDATE thread_members SET last_read_at=now() WHERE thread_id=$1 AND user_id=$2",
    [threadId, userId]
  );
  return { read: true };
}

module.exports = {
  createThread,
  addMember,
  removeMember,
  sendMessage,
  listThreads,
  listMessages,
  markRead,
};
