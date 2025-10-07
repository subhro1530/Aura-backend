const bcrypt = require("bcrypt");

const ROUNDS = 12;

async function hashPassword(pw) {
  return bcrypt.hash(pw, ROUNDS);
}

async function verifyPassword(pw, hash) {
  return bcrypt.compare(pw, hash);
}

module.exports = { hashPassword, verifyPassword };
