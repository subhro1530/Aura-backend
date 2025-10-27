const { query } = require("../config/database");
const { v4: uuidv4 } = require("uuid");
const { sendMail } = require("../config/mailer");

async function changeUsername(userId, username) {
  if (!/^[a-z0-9_\.]{3,30}$/i.test(username))
    throw new Error("Invalid username");
  const exists = await query(
    "SELECT 1 FROM users WHERE username=$1 AND id<>$2",
    [username, userId]
  );
  if (exists.rowCount) throw new Error("Username already taken");
  const r = await query(
    "UPDATE users SET username=$1, updated_at=now() WHERE id=$2 RETURNING id, username",
    [username, userId]
  );
  return r.rows[0];
}

async function changeEmail(userId, email) {
  const exists = await query("SELECT 1 FROM users WHERE email=$1 AND id<>$2", [
    email,
    userId,
  ]);
  if (exists.rowCount) throw new Error("Email already in use");
  await query(
    "UPDATE users SET email=$1, verified_at=NULL, updated_at=now() WHERE id=$2",
    [email, userId]
  );

  const token = uuidv4();
  const expires = new Date(Date.now() + 60 * 60000);
  await query(
    "INSERT INTO email_verification_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)",
    [token, userId, expires]
  );
  await sendMail({
    to: email,
    subject: "Verify your new email",
    html: `<p>Verify your new Aura email.</p><p>Token: <b>${token}</b></p>`,
  });
  return { email, verify_sent: true };
}

async function changePhoto(userId, profile_pic) {
  const r = await query(
    "UPDATE users SET profile_pic=$1, updated_at=now() WHERE id=$2 RETURNING id, profile_pic",
    [profile_pic || null, userId]
  );
  return r.rows[0];
}

module.exports = { changeUsername, changeEmail, changePhoto };
