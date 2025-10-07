const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const moodRoutes = require("./routes/mood.routes");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Health check
app.get("/health", (_req, res) =>
  res.json({ status: "ok", uptime: process.uptime() })
);

// Module 1
app.use("/auth", authRoutes);
app.use("/user", userRoutes);
app.use("/mood", moodRoutes); // gated per-user by moodEnabled middleware

app.use(notFound);
app.use(errorHandler);

module.exports = app;
app.use(notFound);
app.use(errorHandler);

module.exports = app;
