const { query } = require("../config/database");

async function getProfile(id) {
  const res = await query(
    "SELECT id, email, username, bio, profile_pic, mood_preference, verified_at, created_at FROM users WHERE id=$1 AND deleted_at IS NULL",
    [id]
  );
  if (!res.rowCount) throw new Error("User not found");
  return res.rows[0];
}

async function getProfileByUsername(username) {
  const res = await query(
    "SELECT id, email, username, bio, profile_pic, mood_preference, verified_at, created_at FROM users WHERE username=$1 AND deleted_at IS NULL",
    [username]
  );
  if (!res.rowCount) throw new Error("User not found");
  return res.rows[0];
}

async function updateProfile(
  userId,
  { username, bio, mood_preference, profile_pic }
) {
  const fields = { username, bio, mood_preference, profile_pic };
  const setClauses = [];
  const values = [];
  let idx = 1;
  for (const [k, v] of Object.entries(fields)) {
    if (typeof v !== "undefined") {
      setClauses.push(`${k}=$${idx++}`);
      values.push(v);
    }
  }
  if (!setClauses.length) return getProfile(userId);
  values.push(userId);
  const sql = `UPDATE users SET ${setClauses.join(
    ", "
  )}, updated_at=now() WHERE id=$${idx} RETURNING id,email,username,bio,profile_pic,mood_preference`;
  const res = await query(sql, values);
  return res.rows[0];
}

async function softDelete(userId) {
  await query(
    "UPDATE users SET deleted_at=now() WHERE id=$1 AND deleted_at IS NULL",
    [userId]
  );
  await query(
    "UPDATE sessions SET revoked=true, revoked_at=now() WHERE user_id=$1",
    [userId]
  );
  return { success: true };
}

async function blockUser(blocker, target) {
  if (blocker === target) throw new Error("Cannot block self");
  await query(
    "INSERT INTO user_blocks (blocker_id, blocked_id) VALUES ($1,$2) ON CONFLICT DO NOTHING",
    [blocker, target]
  );
  return { success: true };
}

async function reportUser(reporter, target, reason) {
  if (reporter === target) throw new Error("Cannot report self");
  await query(
    "INSERT INTO user_reports (reporter_id, reported_id, reason) VALUES ($1,$2,$3)",
    [reporter, target, reason || null]
  );
  return { success: true };
}

async function updatePreferences(
  userId,
  { privacy_level, notifications, mood_enabled }
) {
  const current = await query(
    "SELECT mood_enabled FROM user_preferences WHERE user_id=$1",
    [userId]
  );
  const effectiveMoodEnabled =
    typeof mood_enabled === "boolean"
      ? mood_enabled
      : current.rowCount
      ? current.rows[0].mood_enabled
      : false;

  await query(
    `INSERT INTO user_preferences (user_id, privacy_level, notifications, mood_enabled, updated_at)
     VALUES ($1,$2,$3,$4,now())
     ON CONFLICT (user_id) DO UPDATE SET
       privacy_level=EXCLUDED.privacy_level,
       notifications=EXCLUDED.notifications,
       mood_enabled=EXCLUDED.mood_enabled,
       updated_at=now()`,
    [
      userId,
      privacy_level || "public",
      notifications || { email: true, push: true },
      effectiveMoodEnabled,
    ]
  );
  const res = await query(
    "SELECT user_id, privacy_level, notifications, mood_enabled, updated_at FROM user_preferences WHERE user_id=$1",
    [userId]
  );
  return res.rows[0];
}

module.exports = {
  getProfile,
  getProfileByUsername,
  updateProfile,
  softDelete,
  blockUser,
  reportUser,
  updatePreferences,
};
