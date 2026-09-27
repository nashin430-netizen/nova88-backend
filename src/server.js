import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";

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

app.get("/api/games", async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: { status: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(games);
  } catch (error) {
    res.status(500).json({
      error: "Failed to load games"
    });
  }
});

app.get("/api/promotions", async (req, res) => {
  try {
    const promotions = await prisma.promotion.findMany({
      where: { status: true },
      orderBy: { createdAt: "desc" }
    });

    res.json(promotions);
  } catch (error) {
    res.status(500).json({
      error: "Failed to load promotions"
    });
  }
});

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
