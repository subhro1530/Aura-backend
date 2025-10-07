const logger = require("../config/logger");

function notFound(_req, res) {
  res.status(404).json({ error: "Not Found" });
}

function errorHandler(err, _req, res, _next) {
  // eslint-disable-line
  logger.error("Unhandled error", { err });
  if (err.code === "42P01") {
    return res.status(500).json({
      error:
        'Database schema not initialized. Run: npm run migrate && psql "$DATABASE_URL" -f src/db/migrations/002_add_mood_enabled_pref.sql',
    });
  }
  if (err.code === "22P02") {
    return res.status(400).json({ error: "Invalid identifier format" });
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server Error" });
}

module.exports = { notFound, errorHandler };
