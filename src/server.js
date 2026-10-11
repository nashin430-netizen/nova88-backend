import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";

import { prisma } from "./lib/prisma.js";

import authRoutes from "./routes/auth.js";
import gameRoutes from "./routes/games.js";
import promotionRoutes from "./routes/promotions.js";
import adminRoutes from "./routes/admin.js";
import adminGameRoutes from "./routes/gameRoutes.js";
import depositRoutes from "./routes/deposits.js";
import settingsRoutes from "./routes/settings.js";

const app = express();

// =====================================
// SECURITY
// =====================================

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.FRONTEND_ORIGIN ||
      "http://localhost:5500"
  })
);

app.use(express.json({ limit: "1mb" }));

// =====================================
// HEALTH CHECK
// =====================================

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "nova88-demo-backend"
  });
});

// =====================================
// AUTH ROUTES
// =====================================

app.use("/api/auth", authRoutes);

// =====================================
// ADMIN ROUTES
// =====================================

app.use("/api/admin", adminRoutes);

// =====================================
// GAME ROUTES
// =====================================

app.use("/api/games", gameRoutes);
app.use("/api/admin/games", adminGameRoutes);

// =====================================
// PROMOTION ROUTES
// =====================================

app.use("/api/promotions", promotionRoutes);
app.use("/api/admin/promotions", promotionRoutes);

// =====================================
// DEPOSIT ROUTES
// =====================================

app.use("/api/deposits", depositRoutes);

// =====================================
// SETTINGS ROUTES
// =====================================

app.use("/api/settings", settingsRoutes);

// =====================================
// 404 HANDLER
// =====================================

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

// =====================================
// ERROR HANDLER
// =====================================

app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: "Internal server error"
  });
});

// =====================================
// SERVER
// =====================================

const port = Number(process.env.PORT || 5000);

const server = app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

// =====================================
// GRACEFUL SHUTDOWN
// =====================================

async function shutdown() {
  console.log("Shutting down server...");

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
