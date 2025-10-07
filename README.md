# AURA Backend (Neon Postgres + Express)

Tagline: Share your vibe, not your vanity.

Status:

- Module 1 (Authentication & User Management): Implemented.
- Module 2 (Mood Detection & Emotion Engine): Scaffold + Gemini integration placeholder (disabled by default).
- Future Modules: Circles, Posts, Feed personalization, Aura levels, Journals, Premium.

## Stack

- Runtime: Node.js (Express)
- DB: Neon PostgreSQL (SQL via pg)
- Auth: JWT (access tokens with revocable jti via sessions table)
- Email: Nodemailer (SMTP or console fallback)
- Mood AI: Google Gemini API (text/image stubs)
- Logging: Winston
- Structure: Layered (routes → controllers → services → db)

## Project Structure

src/
app.js Express app (middleware + routes)
server.js Bootstraps server
config/ Environment, db, logger, mailer
controllers/ Route controllers
services/ Business logic + Gemini integration
routes/ Express routers
middleware/ Auth + error handlers
utils/ Helpers (tokens, password)
db/
index.js Query helper
migrations/001_init.sql Schema
README.md
.gitignore
.env.example

## Environment Variables (.env)

See .env.example. Core:
DATABASE_URL=postgres://...
JWT_SECRET=supersecret
PORT=4000
SMTP_HOST=...
GEMINI_API_KEY=...
RESEND_API_KEY=...

## Schema Initialization

Automatic migrations run at startup (001_init.sql + 002_add_mood_enabled_pref.sql) if the users table is missing.
Set AUTO_MIGRATE=0 in .env to disable and manage migrations manually.

## Module 1 Endpoints

POST /auth/register
POST /auth/login
POST /auth/logout
POST /auth/verify-email
POST /auth/forgot-password
PUT /auth/reset-password
POST /auth/social-login (placeholder 501)
GET /user/profile/:id
PUT /user/profile/update
DELETE /user/delete
POST /user/block/:id
POST /user/report/:id
PUT /user/preferences

All protected (except register/login/verify/forgot/reset/social) require Authorization: Bearer <token>.

## Module 2 (Scaffold Only)

POST /mood/analyze-text
POST /mood/analyze-image
POST /mood/analyze-video (placeholder)
GET /mood/analyze-feed (placeholder)
GET /mood/current (placeholder)
POST /mood/update (manual override)
GET /mood/trends (placeholder)
GET /mood/summary/weekly (placeholder)
(Feature access controlled by user preference mood_enabled, not an env flag.)

## Module 3 (Posts, Feed & Interactions)

POST /posts/create
GET /posts/:id
GET /posts/user/:userId (userId or 'me')
GET /posts/feed
GET /posts/trending
POST /posts/like/:id (toggle)
POST /posts/comment/:id
GET /posts/comments/:id
DELETE /posts/delete/:id
GET /posts/vibe-match (preview vibe scores for current feed)
POST /posts/share/:id { target_type: story|circle, circle_id? }
POST /posts/save/:id (toggle)
GET /posts/saved
POST /posts/report/:id

## Email Sending

If RESEND_API_KEY is set, emails are sent via Resend (free dev tier). Fallback:

- If SMTP\_\* vars set → Nodemailer SMTP.
- Else → Logged to console (dev only).

## Mood Feature Toggle

Mood endpoints are always mounted. Access requires user preference "mood_enabled": true (preference updates now preserve existing mood_enabled if omitted).

## Removed Note

The earlier reference to ENABLE_MOOD env flag is obsolete (feature is preference-driven).

## New Migration

Run after pulling:
psql "$DATABASE_URL" -f src/db/migrations/002_add_mood_enabled_pref.sql

Add migrations 003_posts.sql & 004_search_indexes.sql for posts + search indexes (auto-applied if missing).

## Migration Tracking

A schema_migrations table now records applied migration filenames. On each startup (if AUTO_MIGRATE=1) the server applies any new files in src/db/migrations/ in order:
001_init.sql → 002_add_mood_enabled_pref.sql → 003_posts.sql → 004_search_indexes.sql

If you add a new migration, just drop the file in the directory and restart the server.

If you see a 42P01 error during an API call (e.g. posts table missing) but users table exists:

1. Confirm the migration file (e.g. 003_posts.sql) is present.
2. Restart the server (AUTO_MIGRATE=1).
3. Check schema_migrations for the filename:
   SELECT \* FROM schema_migrations ORDER BY id;
4. If not listed, inspect logs for "Migration statement failed".

Manual apply example:
psql "$DATABASE_URL" -f src/db/migrations/003_posts.sql
INSERT INTO schema_migrations (filename) VALUES ('003_posts.sql');

## Security Notes

- Passwords: bcrypt hashed.
- JWT revocation: sessions table (revoked flag) on logout.
- Soft delete users: sets deleted_at; login automatically blocked.
- Rate limiting not yet implemented (add ASAP for production).
- Add HTTPS, CSP, and secrets rotation before launch.

## Running

npm install
cp .env.example .env
Fill in values.
npm run dev

## API Testing (curl)

Set a helper env (optional):
BASE=http://localhost:4000

### 1. Auth

Register:
curl -X POST $BASE/auth/register -H "Content-Type: application/json" -d '{"email":"user1@example.com","username":"user1","password":"Passw0rd!"}'

(Email token is logged / sent. Use the token you see in logs or inbox.)
Verify email:
curl -X POST $BASE/auth/verify-email -H "Content-Type: application/json" -d '{"token":"<VERIFICATION_TOKEN>"}'

Login:
curl -X POST $BASE/auth/login -H "Content-Type: application/json" -d '{"email":"user1@example.com","password":"Passw0rd!"}'

Export token (bash):
TOKEN=<PASTE_JWT>

Forgot password:
curl -X POST $BASE/auth/forgot-password -H "Content-Type: application/json" -d '{"email":"user1@example.com"}'

Reset password (use reset token from email/log):
curl -X PUT $BASE/auth/reset-password -H "Content-Type: application/json" -d '{"token":"<RESET_TOKEN>","newPassword":"NewPassw0rd!"}'

Logout:
curl -X POST $BASE/auth/logout -H "Authorization: Bearer $TOKEN"

Social login (placeholder, will 501 unless you pass provider/providerId):
curl -X POST $BASE/auth/social-login -H "Content-Type: application/json" -d '{"provider":"google","providerId":"abc123","email":"user1@example.com","username":"user1g"}'

### 2. User

Get profile by:

- ID: GET /user/profile/<UUID>
- Username: GET /user/profile/<username>
- Current user: GET /user/profile/me

Get profile (need target user id):
curl -X GET $BASE/user/profile/<USER_ID> -H "Authorization: Bearer $TOKEN"

Update profile:
curl -X PUT $BASE/user/profile/update -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"bio":"Hello Aura","mood_preference":"calm"}'

Update preferences (enable mood features):
curl -X PUT $BASE/user/preferences -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"privacy_level":"public","mood_enabled":true}'

Block user:
curl -X POST $BASE/user/block/<OTHER_USER_ID> -H "Authorization: Bearer $TOKEN"

Report user:
curl -X POST $BASE/user/report/<OTHER_USER_ID> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"reason":"spam"}'

Delete (soft) account:
curl -X DELETE $BASE/user/delete -H "Authorization: Bearer $TOKEN"

### 3. Mood (Requires mood_enabled=true in preferences)

Analyze text mood:
curl -X POST $BASE/mood/analyze-text -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"text":"I feel hopeful and energized today!"}'

Analyze image mood (dummy base64):
IMG=$(echo -n "test" | base64)
curl -X POST $BASE/mood/analyze-image -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"imageBase64\":\"$IMG\"}"

Analyze video (placeholder):
curl -X POST $BASE/mood/analyze-video -H "Authorization: Bearer $TOKEN"

Personalized feed (placeholder):
curl -X GET $BASE/mood/analyze-feed -H "Authorization: Bearer $TOKEN"

Current mood (placeholder neutral until persistence added):
curl -X GET $BASE/mood/current -H "Authorization: Bearer $TOKEN"

Manual mood override:
curl -X POST $BASE/mood/update -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"mood":"motivated"}'

Mood trends (placeholder):
curl -X GET $BASE/mood/trends -H "Authorization: Bearer $TOKEN"

Weekly summary (placeholder):
curl -X GET $BASE/mood/summary/weekly -H "Authorization: Bearer $TOKEN"

### 4. Posts, Feed & Interactions (Module 3)

Create post:
curl -X POST $BASE/posts/create -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"caption":"First post!","emotion":"happy","tags":["intro","vibe"]}'

Feed:
curl -X GET $BASE/posts/feed -H "Authorization: Bearer $TOKEN"

Like toggle:
curl -X POST $BASE/posts/like/<POST_ID> -H "Authorization: Bearer $TOKEN"

Comment:
curl -X POST $BASE/posts/comment/<POST_ID> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"content":"Nice!","emotion":"excited"}'

List comments:
curl -X GET $BASE/posts/comments/<POST_ID> -H "Authorization: Bearer $TOKEN"

Save toggle:
curl -X POST $BASE/posts/save/<POST_ID> -H "Authorization: Bearer $TOKEN"

Saved:
curl -X GET $BASE/posts/saved -H "Authorization: Bearer $TOKEN"

Trending:
curl -X GET $BASE/posts/trending -H "Authorization: Bearer $TOKEN"

Vibe match preview:
curl -X GET $BASE/posts/vibe-match -H "Authorization: Bearer $TOKEN"

Delete post:
curl -X DELETE $BASE/posts/delete/<POST_ID> -H "Authorization: Bearer $TOKEN"

Report post:
curl -X POST $BASE/posts/report/<POST_ID> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"reason":"spam"}'

Share:
curl -X POST $BASE/posts/share/<POST_ID> -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"target_type":"story"}'

## Module X (Search)

Unified endpoint auto-detects:

- @prefix → user search
- #prefix → tag search
- plain text → post search

GET /search?q=@alice
GET /search?q=#calm
GET /search?q=morning

Explicit:
GET /search/users?q=alice
GET /search/posts?q=energy
GET /search/suggest (mixed suggestions)
GET /search/suggest?q=a (prefix user suggestions)

### Search Testing (curl)

User search (@ prefix):
curl -X GET "$BASE/search?q=@user1" -H "Authorization: Bearer $TOKEN"

Tag search (# prefix):
curl -X GET "$BASE/search?q=#intro" -H "Authorization: Bearer $TOKEN"

Post text search:
curl -X GET "$BASE/search?q=happy%20day" -H "Authorization: Bearer $TOKEN"

Explicit user search:
curl -X GET "$BASE/search/users?q=user" -H "Authorization: Bearer $TOKEN"

Explicit post search:
curl -X GET "$BASE/search/posts?q=calm" -H "Authorization: Bearer $TOKEN"

Tag (explicit via unified already):
curl -X GET "$BASE/search?q=#vibe" -H "Authorization: Bearer $TOKEN"

Suggestions (no query):
curl -X GET "$BASE/search/suggest" -H "Authorization: Bearer $TOKEN"

Suggestions (short query):
curl -X GET "$BASE/search/suggest?q=u" -H "Authorization: Bearer $TOKEN"

Pagination example:
curl -X GET "$BASE/search/posts?q=energy&limit=30&offset=30" -H "Authorization: Bearer $TOKEN"

### 5. Typical Flow Quick Script (bash)

Register → Verify (copy token) → Login → Enable mood → Analyze:

# After getting VERIFICATION_TOKEN and setting TOKEN

curl -X PUT $BASE/user/preferences -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"mood_enabled":true}'
curl -X POST $BASE/mood/analyze-text -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"text":"Feeling a bit anxious but also excited for progress."}'

### Notes

- Verification / reset tokens are stored in DB and shown via email provider (Resend/SMTP) or console fallback.
- Placeholder mood endpoints will evolve once persistence & scoring are added.

## Troubleshooting

Error code 42P01 (relation does not exist):
Run:
npm run migrate
psql "$DATABASE_URL" -f src/db/migrations/002_add_mood_enabled_pref.sql

Ensure extension (pgcrypto) added (now included at top of 001_init.sql). If created before, run:
psql "$DATABASE_URL" -c 'CREATE EXTENSION IF NOT EXISTS pgcrypto;'

If you still see "Users table missing":

1. Ensure AUTO_MIGRATE=1
2. Check logs for migration errors
3. Run manually:
   npm run migrate
   psql "$DATABASE_URL" -f src/db/migrations/002_add_mood_enabled_pref.sql

### Migration / Schema Troubleshooting

If you see:
{"error":"Database schema not initialized..."
Likely initial migration failed. Common causes:

1. pgcrypto extension privilege denied (Neon role). Fix:
   - Enable pgcrypto in Neon dashboard OR remove DEFAULT gen_random_uuid() and generate UUIDs in app.
2. Network interruption during auto-migrate.
3. AUTO_MIGRATE=0 and migrations not run manually.

The server now:

- Runs each migration statement individually.
- Skips (logs warning) if CREATE EXTENSION fails, continuing with table creation.

To re-run from scratch (destructive):
DROP TABLE IF EXISTS users CASCADE;
Then restart server (auto-migrate) or run migrations manually.

Check logs for lines: "Migration statement failed" or "Extension statement skipped".

## License

Proprietary (Adjust as needed).

Enjoy building Aura.
