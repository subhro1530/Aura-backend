const { verifyJWT } = require("../utils/tokens");
const { query } = require("../config/database");

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [, token] = header.split(" ");
    if (!token) return res.status(401).json({ error: "Missing token" });
    const payload = verifyJWT(token);
    const sessionRes = await query("SELECT revoked FROM sessions WHERE id=$1", [
      payload.jti,
    ]);
    if (!sessionRes.rowCount)
      return res.status(401).json({ error: "Session invalidated" });
    if (sessionRes.rows[0].revoked)
      return res.status(401).json({ error: "Session revoked" });

    const userRes = await query(
      "SELECT id, deleted_at FROM users WHERE id=$1",
      [payload.sub]
    );
    if (!userRes.rowCount || userRes.rows[0].deleted_at)
      return res.status(401).json({ error: "User inactive" });

    req.user = { id: payload.sub, jti: payload.jti };
    next();
  } catch (_e) {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

module.exports = { auth };
