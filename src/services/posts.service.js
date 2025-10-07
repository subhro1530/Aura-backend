const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map(String).slice(0, 20);
  if (typeof tags === "string")
    return tags
      .split(/[,\s]+/)
      .filter(Boolean)
      .slice(0, 20);
  return [];
}

async function create({
  userId,
  caption,
  media_url,
  media_type,
  emotion,
  tags,
}) {
  const tagArr = normalizeTags(tags);
  const res = await query(
    `INSERT INTO posts (user_id, caption, media_url, media_type, emotion, tags)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING *`,
    [
      userId,
      caption || null,
      media_url || null,
      media_type || null,
      emotion || "neutral",
      tagArr,
    ]
  );
  return res.rows[0];
}

async function getOne(postId, requester) {
  const res = await query(
    `SELECT p.*, 
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id=p.id AND pl.user_id=$2) AS liked,
        EXISTS(SELECT 1 FROM post_saves ps WHERE ps.post_id=p.id AND ps.user_id=$2) AS saved
     FROM posts p
     WHERE p.id=$1 AND p.deleted_at IS NULL`,
    [postId, requester]
  );
  if (!res.rowCount) throw new Error("Post not found");
  return res.rows[0];
}

async function byUser(userId, requester) {
  const res = await query(
    `SELECT p.*,
        EXISTS(SELECT 1 FROM post_likes pl WHERE pl.post_id=p.id AND pl.user_id=$2) AS liked
     FROM posts p
     WHERE p.user_id=$1 AND p.deleted_at IS NULL
     ORDER BY p.created_at DESC
     LIMIT 100`,
    [userId, requester]
  );
  return res.rows;
}

async function feed(userId) {
  // Basic feed: latest posts excluding deleted; future: exclude blocked
  const pref = await query("SELECT mood_preference FROM users WHERE id=$1", [
    userId,
  ]);
  const moodPref = pref.rowCount ? pref.rows[0].mood_preference : null;

  // Only one parameter now ($1). Previously we passed an unused $1 (userId) causing 42P18.
  const res = await query(
    `SELECT p.*,
       CASE 
         WHEN $1::text IS NOT NULL AND p.emotion = $1::text THEN 95
         WHEN $1::text IS NOT NULL AND $1::text = ANY(p.tags) THEN 80
         ELSE 55
       END AS vibe_score
     FROM posts p
     WHERE p.deleted_at IS NULL
     ORDER BY vibe_score DESC, p.created_at DESC
     LIMIT 50`,
    [moodPref]
  );
  return res.rows;
}

async function trending(userId) {
  const res = await query(
    `SELECT p.*,
        (p.like_count * 2 + p.comment_count) AS rank_score
     FROM posts p
     WHERE p.deleted_at IS NULL
     ORDER BY rank_score DESC, p.created_at DESC
     LIMIT 30`
  );
  return res.rows;
}

async function likeToggle(userId, postId) {
  const existing = await query(
    "SELECT 1 FROM post_likes WHERE user_id=$1 AND post_id=$2",
    [userId, postId]
  );
  if (existing.rowCount) {
    await query("DELETE FROM post_likes WHERE user_id=$1 AND post_id=$2", [
      userId,
      postId,
    ]);
    await query(
      "UPDATE posts SET like_count=GREATEST(like_count-1,0) WHERE id=$1",
      [postId]
    );
    return { liked: false };
  } else {
    await query(
      "INSERT INTO post_likes (user_id, post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [userId, postId]
    );
    await query("UPDATE posts SET like_count=like_count+1 WHERE id=$1", [
      postId,
    ]);
    return { liked: true };
  }
}

async function addComment(userId, postId, content, emotion) {
  const res = await query(
    `INSERT INTO post_comments (post_id, user_id, content, emotion)
     VALUES ($1,$2,$3,$4) RETURNING *`,
    [postId, userId, content, emotion || null]
  );
  await query("UPDATE posts SET comment_count=comment_count+1 WHERE id=$1", [
    postId,
  ]);
  return res.rows[0];
}

async function getComments(postId) {
  const res = await query(
    `SELECT * FROM post_comments
     WHERE post_id=$1 AND deleted_at IS NULL
     ORDER BY created_at ASC
     LIMIT 200`,
    [postId]
  );
  return res.rows;
}

async function deletePost(userId, postId) {
  const res = await query(
    "UPDATE posts SET deleted_at=now() WHERE id=$1 AND user_id=$2 AND deleted_at IS NULL RETURNING id",
    [postId, userId]
  );
  if (!res.rowCount) throw new Error("Not found or no permission");
  return { deleted: true };
}

async function vibeMatch(userId) {
  // Return top 20 vibe scores for preview
  const rows = await feed(userId);
  return rows
    .slice(0, 20)
    .map((p) => ({ post_id: p.id, vibe_score: p.vibe_score }));
}

async function share(userId, postId, target_type, circle_id) {
  if (!target_type) target_type = "story";
  await query(
    `INSERT INTO post_shares (post_id, user_id, target_type, circle_id)
     VALUES ($1,$2,$3,$4)`,
    [postId, userId, target_type, circle_id || null]
  );
  await query("UPDATE posts SET share_count=share_count+1 WHERE id=$1", [
    postId,
  ]);
  return { shared: true, target_type };
}

async function saveToggle(userId, postId) {
  const existing = await query(
    "SELECT 1 FROM post_saves WHERE user_id=$1 AND post_id=$2",
    [userId, postId]
  );
  if (existing.rowCount) {
    await query("DELETE FROM post_saves WHERE user_id=$1 AND post_id=$2", [
      userId,
      postId,
    ]);
    await query(
      "UPDATE posts SET saved_count=GREATEST(saved_count-1,0) WHERE id=$1",
      [postId]
    );
    return { saved: false };
  } else {
    await query(
      "INSERT INTO post_saves (user_id, post_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
      [userId, postId]
    );
    await query("UPDATE posts SET saved_count=saved_count+1 WHERE id=$1", [
      postId,
    ]);
    return { saved: true };
  }
}

async function getSaved(userId) {
  const res = await query(
    `SELECT p.* FROM post_saves s
     JOIN posts p ON p.id=s.post_id
     WHERE s.user_id=$1 AND p.deleted_at IS NULL
     ORDER BY s.created_at DESC
     LIMIT 100`,
    [userId]
  );
  return res.rows;
}

async function report(userId, postId, reason) {
  await query(
    "INSERT INTO post_reports (post_id, reporter_id, reason) VALUES ($1,$2,$3)",
    [postId, userId, reason || null]
  );
  return { reported: true };
}

module.exports = {
  create,
  getOne,
  byUser,
  feed,
  trending,
  likeToggle,
  addComment,
  getComments,
  deletePost,
  vibeMatch,
  share,
  saveToggle,
  getSaved,
  report,
};
