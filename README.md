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

### 4. Typical Flow Quick Script (bash)

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

## License

Proprietary (Adjust as needed).

Enjoy building Aura.
