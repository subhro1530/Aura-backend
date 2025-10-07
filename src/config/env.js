const path = require("path");
const dotenv = require("dotenv");

function loadEnv() {
  const envFile = path.resolve(process.cwd(), ".env");
  dotenv.config({ path: envFile });
}

module.exports = { loadEnv };
