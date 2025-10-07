const { query } = require("../config/database");

async function moodEnabled(req, res, next) {
  try {
    const r = await query(
      "SELECT mood_enabled FROM user_preferences WHERE user_id=$1",
      [req.user.id]
    );
    const enabled = r.rowCount ? r.rows[0].mood_enabled : false;
    if (!enabled)
      return res
        .status(403)
        .json({ error: "Mood feature disabled in preferences" });
    next();
  } catch (e) {
    next(e);
  }
}

module.exports = { moodEnabled };
