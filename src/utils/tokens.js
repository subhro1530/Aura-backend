const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

function createJWT(userId) {
  const jti = uuidv4();
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES || "7d";
  const token = jwt.sign({ sub: userId, jti }, secret, { expiresIn });
  return { token, jti };
}

function verifyJWT(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { createJWT, verifyJWT };
