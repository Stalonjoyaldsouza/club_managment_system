import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import memberRoutes from "./routes/members.js";
import attendanceRoutes from "./routes/attendance.js";
import inventoryRoutes from "./routes/inventory.js";
import projectRoutes from "./routes/projects.js";
import eventRoutes from "./routes/events.js";
import emailRoutes from "./routes/email.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../.env") });
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const allowedOrigins = new Set([
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://localhost:5173"
]);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => res.json({ ok: true, name: "ClubNexus API" }));
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/members", memberRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/email", emailRoutes);

app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((err, _req, res, _next) => {
  console.error(err);
  if (err.code === "P2002") return res.status(409).json({ message: "A record with these details already exists" });
  if (err.code === "P2025") return res.status(404).json({ message: "Record not found" });
  res.status(500).json({ message: err.message || "Server error" });
});

const server = app.listen(port, () => console.log(`ClubNexus API running on http://localhost:${port}`));

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${port} is already in use. Stop the existing backend process or set PORT to a different value in backend/.env.`);
    process.exit(1);
  }
  throw error;
});
