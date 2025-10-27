const { query } = require("../config/database");

async function follow(followerId, targetId) {
  if (followerId === targetId) throw new Error("Cannot follow self");
  await query(
    "INSERT INTO follows (follower_id, following_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [followerId, targetId]
  );
  return { following: true };
}

async function unfollow(followerId, targetId) {
  await query("DELETE FROM follows WHERE follower_id=$1 AND following_id=$2", [
    followerId,
    targetId,
  ]);
  return { following: false };
}

async function followers(userId, limit = 50, offset = 0) {
  const r = await query(
    `SELECT u.id, u.username, u.profile_pic, (u.verified_at IS NOT NULL) AS verified, f.created_at
     FROM follows f
     JOIN users u ON u.id = f.follower_id
     WHERE f.following_id=$1 AND u.deleted_at IS NULL
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return r.rows;
}

async function following(userId, limit = 50, offset = 0) {
  const r = await query(
    `SELECT u.id, u.username, u.profile_pic, (u.verified_at IS NOT NULL) AS verified, f.created_at
     FROM follows f
     JOIN users u ON u.id = f.following_id
     WHERE f.follower_id=$1 AND u.deleted_at IS NULL
     ORDER BY f.created_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return r.rows;
}

async function suggestions(userId, limit = 20) {
  const r = await query(
    `SELECT u.id, u.username, u.profile_pic, (u.verified_at IS NOT NULL) AS verified
     FROM users u
     WHERE u.deleted_at IS NULL
       AND u.id <> $1
       AND u.id NOT IN (SELECT following_id FROM follows WHERE follower_id=$1)
     ORDER BY u.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return r.rows;
}

async function mutual(userId, otherId) {
  const r = await query(
    `SELECT u.id, u.username, u.profile_pic
     FROM follows f1
     JOIN follows f2 ON f1.follower_id=f2.follower_id
     JOIN users u ON u.id=f1.follower_id
     WHERE f1.following_id=$1 AND f2.following_id=$2
       AND u.deleted_at IS NULL`,
    [userId, otherId]
  );
  return r.rows;
}

async function followStatus(userId, otherId) {
  const a = await query(
    "SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2",
    [userId, otherId]
  );
  const b = await query(
    "SELECT 1 FROM follows WHERE follower_id=$1 AND following_id=$2",
    [otherId, userId]
  );
  return { i_follow: !!a.rowCount, follows_me: !!b.rowCount };
}

module.exports = {
  follow,
  unfollow,
  followers,
  following,
  suggestions,
  mutual,
  followStatus,
};
