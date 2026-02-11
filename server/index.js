import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { DatabaseSync } from "node:sqlite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "data", "kids_games.db");

const db = new DatabaseSync(DB_PATH);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_key TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS progress_user_game_idx ON progress(user_id, game_key);

    CREATE TABLE IF NOT EXISTS auth_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      username TEXT,
      event_type TEXT NOT NULL,
      ip TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS auth_events_user_created_idx ON auth_events(user_id, created_at DESC);

  `);

  const cols = db.prepare("PRAGMA table_info(users)").all();
  const hasRoleColumn = cols.some((c) => c.name === "role");
  if (!hasRoleColumn) {
    db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'");
  }
}

initDb();

const app = express();
app.use(cors());
app.use(express.json());

function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username, display_name: user.display_name, role: user.role || "user" }, JWT_SECRET, { expiresIn: "7d" });
}

function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "unauthorized" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ error: "unauthorized" });
  }
}

function validateUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username || "");
}

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || "";
}

function logAuthEvent({ req, userId = null, username = null, eventType }) {
  try {
    const ip = getClientIp(req);
    const userAgent = String(req.headers["user-agent"] || "").slice(0, 300);
    db.prepare(`
      INSERT INTO auth_events (user_id, username, event_type, ip, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, username, eventType, ip, userAgent);
  } catch {
    // auth flow should not fail if audit insert fails
  }
}

app.post("/api/auth/register", (req, res) => {
  const { username, display_name, password } = req.body || {};
  if (!validateUsername(username)) {
    return res.status(400).json({ error: "username must be 3-20 chars, letters/numbers/underscore" });
  }
  if (!display_name || display_name.length < 2 || display_name.length > 30) {
    return res.status(400).json({ error: "display_name must be 2-30 chars" });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ error: "password must be at least 6 chars" });
  }

  const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (existing) return res.status(409).json({ error: "username already exists" });

  const password_hash = bcrypt.hashSync(password, 10);
  const stmt = db.prepare("INSERT INTO users (username, display_name, password_hash, role) VALUES (?, ?, ?, 'user')");
  const info = stmt.run(username, display_name, password_hash);
  const user = { id: info.lastInsertRowid, username, display_name, role: "user" };
  const token = signToken(user);
  logAuthEvent({ req, userId: user.id, username: user.username, eventType: "register" });
  return res.json({ token, user });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    logAuthEvent({ req, username, eventType: "login_failed" });
    return res.status(401).json({ error: "invalid credentials" });
  }
  const ok = bcrypt.compareSync(password || "", user.password_hash);
  if (!ok) {
    logAuthEvent({ req, userId: user.id, username: user.username, eventType: "login_failed" });
    return res.status(401).json({ error: "invalid credentials" });
  }

  const token = signToken(user);
  logAuthEvent({ req, userId: user.id, username: user.username, eventType: "login" });
  return res.json({
    token,
    user: { id: user.id, username: user.username, display_name: user.display_name, role: user.role || "user" }
  });
});

app.post("/api/auth/logout", auth, (req, res) => {
  logAuthEvent({
    req,
    userId: req.user.id,
    username: req.user.username,
    eventType: "logout"
  });
  return res.json({ ok: true });
});

app.get("/api/auth/events", auth, (req, res) => {
  const rows = db.prepare(`
    SELECT id, username, event_type, ip, user_agent, created_at
    FROM auth_events
    WHERE user_id = ?
    ORDER BY created_at DESC, id DESC
    LIMIT 100
  `).all(req.user.id);
  return res.json({ events: rows });
});

app.get("/api/me", auth, (req, res) => {
  return res.json({ user: req.user });
});

app.get("/api/progress", auth, (req, res) => {
  const rows = db.prepare("SELECT game_key, score, level, updated_at FROM progress WHERE user_id = ?").all(req.user.id);
  return res.json({ progress: rows });
});

app.post("/api/progress", auth, (req, res) => {
  const { game_key, score, level } = req.body || {};
  if (!game_key) return res.status(400).json({ error: "game_key required" });
  const safeScore = Number.isFinite(score) ? score : 0;
  const safeLevel = Number.isFinite(level) ? level : 1;

  const stmt = db.prepare(`
    INSERT INTO progress (user_id, game_key, score, level, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, game_key)
    DO UPDATE SET score = excluded.score, level = excluded.level, updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(req.user.id, game_key, safeScore, safeLevel);
  return res.json({ ok: true });
});

const clientDir = path.join(__dirname, "..", "client");
app.use(express.static(clientDir));

app.get("*", (_req, res) => {
  res.sendFile(path.join(clientDir, "index.html"));
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
app.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});

