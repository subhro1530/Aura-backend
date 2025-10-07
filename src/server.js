const { loadEnv } = require("./config/env");
loadEnv(); // must run early
const logger = require("./config/logger");
const app = require("./app");
const { query } = require("./config/database");
const fs = require("fs");
const path = require("path");

async function applyMigration(filePath) {
  const sql = fs.readFileSync(filePath, "utf8");
  try {
    await query(sql); // execute whole file to preserve ordering (FK refs)
    logger.info(`Applied migration: ${path.basename(filePath)}`);
  } catch (e) {
    logger.error(`Migration failed: ${path.basename(filePath)}`, {
      error: e.message,
      code: e.code,
    });
    throw e;
  }
}

async function ensureSchema() {
  try {
    await query("SELECT 1 FROM users LIMIT 1");
    logger.info("DB schema check passed");
  } catch (e) {
    if (e.code === "42P01") {
      if (process.env.AUTO_MIGRATE === "0") {
        logger.warn(
          'Users table missing. AUTO_MIGRATE=0 → skipping. Run manually: npm run migrate && psql "$DATABASE_URL" -f src/db/migrations/002_add_mood_enabled_pref.sql'
        );
        return;
      }
      logger.warn("Users table missing. Running auto-migrations...");
      const migDir = path.resolve(__dirname, "db", "migrations");
      const migrations = ["001_init.sql", "002_add_mood_enabled_pref.sql"]
        .map((f) => path.join(migDir, f))
        .filter((f) => fs.existsSync(f));

      for (const m of migrations) {
        await applyMigration(m);
      }

      // Re-check
      try {
        await query("SELECT 1 FROM users LIMIT 1");
        logger.info("Schema verified after migrations");
      } catch (postErr) {
        logger.error("Schema still missing after migrations", {
          error: postErr.message,
        });
        throw postErr;
      }
    } else {
      logger.error("DB schema check failed", { error: e });
    }
  }
}

(async () => {
  try {
    await ensureSchema();
  } catch (fatal) {
    logger.error("Startup aborted due to migration error", {
      error: fatal.message,
    });
    process.exit(1);
  }
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info(`Aura backend running on port ${PORT}`);
  });
})();
