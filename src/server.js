const { loadEnv } = require("./config/env");
loadEnv(); // must run early
const logger = require("./config/logger");
const app = require("./app");
const { query } = require("./config/database");
const fs = require("fs");
const path = require("path");

// List of ordered migration filenames
const MIGRATIONS = [
  "001_init.sql",
  "002_add_mood_enabled_pref.sql",
  "003_posts.sql",
  "004_search_indexes.sql",
];

// Ensure schema_migrations tracking table exists
async function ensureMigrationsTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       id SERIAL PRIMARY KEY,
       filename TEXT UNIQUE NOT NULL,
       applied_at TIMESTAMPTZ DEFAULT now()
     )`
  );
}

// Run a migration file statement-by-statement so one failing statement does not block the rest.
async function applyMigration(filePath, filename) {
  const raw = fs.readFileSync(filePath, "utf8");
  const statements = raw
    .split(/;\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);

  logger.info(
    `Applying migration: ${filename} (${statements.length} statements)`
  );

  for (const stmt of statements) {
    try {
      await query(stmt);
    } catch (e) {
      const lowered = stmt.toLowerCase();
      if (lowered.startsWith("create extension") && e.code) {
        logger.warn(`Extension statement skipped (${e.code}): ${e.message}`);
        continue;
      }
      logger.error("Migration statement failed", {
        migration: filename,
        error: e.message,
        code: e.code,
        stmt: stmt.slice(0, 120),
      });
      throw e;
    }
  }
  await query(
    "INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING",
    [filename]
  );
  logger.info(`Migration applied: ${filename}`);
}

async function applyPendingMigrations() {
  const migDir = path.resolve(__dirname, "db", "migrations");
  await ensureMigrationsTable();
  const res = await query("SELECT filename FROM schema_migrations");
  const applied = new Set(res.rows.map((r) => r.filename));
  for (const fname of MIGRATIONS) {
    const full = path.join(migDir, fname);
    if (!fs.existsSync(full)) continue;
    if (!applied.has(fname)) {
      await applyMigration(full, fname);
    }
  }
}

// Previous ensureSchema now enhanced: always apply pending migrations.
// If users table missing, migrations will create it; if present, we still add new ones.
async function ensureSchema() {
  let usersExists = true;
  try {
    await query("SELECT 1 FROM users LIMIT 1");
  } catch (e) {
    if (e.code === "42P01") {
      usersExists = false;
      logger.warn("Users table missing (will run full migration set).");
    } else {
      logger.error("DB check failed", { error: e.message });
      throw e;
    }
  }

  if (process.env.AUTO_MIGRATE === "0") {
    if (!usersExists) {
      logger.warn(
        "AUTO_MIGRATE=0 and core table missing. Run migrations manually."
      );
    } else {
      logger.info(
        "AUTO_MIGRATE=0 and base schema detected. Skipping migration scan."
      );
    }
    return;
  }

  logger.info("Scanning for pending migrations...");
  await applyPendingMigrations();

  // Re-check core table
  try {
    await query("SELECT 1 FROM users LIMIT 1");
    logger.info("Schema verified after migration scan");
  } catch (postErr) {
    logger.error("Core table still missing after migrations", {
      error: postErr.message,
    });
    throw postErr;
  }
}

(async () => {
  try {
    await ensureSchema();
  } catch (fatal) {
    logger.error("Startup aborted due to migration error", {
      error: fatal.message,
      hint: "Inspect logs; run SQL manually if needed.",
    });
    process.exit(1);
  }
  const PORT = process.env.PORT || 4000;
  app.listen(PORT, () => {
    logger.info(`Aura backend running on port ${PORT}`);
  });
})();
