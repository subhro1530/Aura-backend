const { Pool } = require("pg");
const logger = require("./logger");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  ssl: process.env.DATABASE_URL?.includes("neon.tech")
    ? { rejectUnauthorized: false }
    : undefined,
});

pool.on("error", (err) => {
  logger.error("Unexpected PG error", { err });
});

async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.LOG_LEVEL === "debug") {
    logger.debug("executed query", { text, duration, rows: res.rowCount });
  }
  return res;
}

module.exports = { pool, query };
