const { query } = require("../config/database");
const { hashPassword, verifyPassword } = require("../utils/password");
const { createJWT } = require("../utils/tokens");
const { v4: uuidv4 } = require("uuid");
const { sendMail } = require("../config/mailer");

const EMAIL_TOKEN_TTL_MIN = 60;
const RESET_TOKEN_TTL_MIN = 30;

async function register({ email, username, password }) {
  const existing = await query(
    "SELECT 1 FROM users WHERE email=$1 OR username=$2",
    [email, username]
  );
  if (existing.rowCount) throw new Error("Email or username already in use");

  const password_hash = await hashPassword(password);
  const user = await query(
    "INSERT INTO users (email, username, password_hash) VALUES ($1,$2,$3) RETURNING id,email,username,created_at",
    [email, username, password_hash]
  );
  const token = uuidv4();
  const expires = new Date(Date.now() + EMAIL_TOKEN_TTL_MIN * 60000);
  await query(
    "INSERT INTO email_verification_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)",
    [token, user.rows[0].id, expires]
  );
  await sendMail({
    to: email,
    subject: "Verify your Aura account",
    html: `<p>Welcome to Aura!</p><p>Verification token: <b>${token}</b></p>`,
  });
  return user.rows[0];
}

async function verifyEmail(token) {
  const res = await query(
    "SELECT * FROM email_verification_tokens WHERE token=$1",
    [token]
  );
  if (!res.rowCount) throw new Error("Invalid token");
  const row = res.rows[0];
  if (row.used_at) throw new Error("Token already used");
  if (new Date(row.expires_at) < new Date()) throw new Error("Token expired");
  await query("UPDATE users SET verified_at=now() WHERE id=$1", [row.user_id]);
  await query(
    "UPDATE email_verification_tokens SET used_at=now() WHERE token=$1",
    [token]
  );
  return { success: true };
}

async function login({ email, password }) {
  const res = await query(
    "SELECT id, password_hash, verified_at, deleted_at FROM users WHERE email=$1",
    [email]
  );
  if (!res.rowCount) throw new Error("Invalid credentials");
  const user = res.rows[0];
  if (user.deleted_at) throw new Error("Account deleted");
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) throw new Error("Invalid credentials");
  const { token, jti } = createJWT(user.id);
  await query("INSERT INTO sessions (id, user_id) VALUES ($1,$2)", [
    jti,
    user.id,
  ]);
  return { token, user: { id: user.id, email } };
}

async function logout(jti) {
  await query(
    "UPDATE sessions SET revoked=true, revoked_at=now() WHERE id=$1",
    [jti]
  );
  return { success: true };
}

async function forgotPassword(email) {
  const res = await query("SELECT id FROM users WHERE email=$1", [email]);
  if (!res.rowCount) return { success: true };
  const user = res.rows[0];
  const token = uuidv4();
  const expires = new Date(Date.now() + RESET_TOKEN_TTL_MIN * 60000);
  await query(
    "INSERT INTO password_reset_tokens (token, user_id, expires_at) VALUES ($1,$2,$3)",
    [token, user.id, expires]
  );
  await sendMail({
    to: email,
    subject: "Aura Password Reset",
    html: `<p>Reset token: <b>${token}</b></p>`,
  });
  return { success: true };
}

async function resetPassword(token, newPassword) {
  const res = await query(
    "SELECT * FROM password_reset_tokens WHERE token=$1",
    [token]
  );
  if (!res.rowCount) throw new Error("Invalid token");
  const row = res.rows[0];
  if (row.used_at) throw new Error("Token already used");
  if (new Date(row.expires_at) < new Date()) throw new Error("Token expired");
  const password_hash = await hashPassword(newPassword);
  await query(
    "UPDATE users SET password_hash=$1, updated_at=now() WHERE id=$2",
    [password_hash, row.user_id]
  );
  await query("UPDATE password_reset_tokens SET used_at=now() WHERE token=$1", [
    token,
  ]);
  return { success: true };
}

async function socialLogin({ provider, providerId, email, username }) {
  if (!provider || !providerId) {
    const err = new Error("Not Implemented");
    err.status = 501;
    throw err;
  }
  let res = await query("SELECT id, email FROM users WHERE email=$1", [email]);
  if (!res.rowCount) {
    const pass = await hashPassword(uuidv4());
    res = await query(
      "INSERT INTO users (email, username, password_hash, verified_at) VALUES ($1,$2,$3,now()) RETURNING id,email",
      [email, username, pass]
    );
  }
  const user = res.rows[0];
  const { token, jti } = createJWT(user.id);
  await query("INSERT INTO sessions (id, user_id) VALUES ($1,$2)", [
    jti,
    user.id,
  ]);
  return { token, user };
}

module.exports = {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
  socialLogin,
};
