import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";

import authRoutes from "./routes/auth.js";
import gameRoutes from "./routes/games.js";
import promotionRoutes from "./routes/promotions.js";

const app = express();
export const prisma = new PrismaClient();

app.use(helmet());

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "http://localhost:5500"
}));

app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => {
  res.json({
    ok: true,
    service: "nova88-demo-backend"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/games", gameRoutes);
app.use("/api/promotions", promotionRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`API running on port ${port}`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
