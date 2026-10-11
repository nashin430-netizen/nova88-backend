import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";

const router = Router();

// Get all active games
router.get("/", async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      where: {
        status: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return res.json(games);

  } catch (error) {
    console.error("Load games error:", error);

    return res.status(500).json({
      error: "Failed to load games"
    });
  }
});

// Add a new game — Admin only
router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        category,
        icon,
        description,
        image,
        status
      } = req.body;

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof category !== "string" ||
        !category.trim()
      ) {
        return res.status(400).json({
          error: "Name and category are required"
        });
      }

      const game = await prisma.game.create({
        data: {
          name: name.trim(),
          category: category.trim(),
          icon,
          description,
          image,
          ...(typeof status === "boolean"
            ? { status }
            : {})
        }
      });

      return res.status(201).json(game);

    } catch (error) {
      console.error("Create game error:", error);

      return res.status(500).json({
        error: "Failed to create game"
      });
    }
  }
);

// Update a game — Admin only
router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "Invalid game ID"
        });
      }

      const allowed = [
        "name",
        "category",
        "icon",
        "description",
        "image",
        "status"
      ];

      const data = Object.fromEntries(
        Object.entries(req.body).filter(
          ([key]) => allowed.includes(key)
        )
      );

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          error: "No valid fields provided"
        });
      }

      if (
        "name" in data &&
        (
          typeof data.name !== "string" ||
          !data.name.trim()
        )
      ) {
        return res.status(400).json({
          error: "Game name cannot be empty"
        });
      }

      if (
        "category" in data &&
        (
          typeof data.category !== "string" ||
          !data.category.trim()
        )
      ) {
        return res.status(400).json({
          error: "Game category cannot be empty"
        });
      }

      if (
        "status" in data &&
        typeof data.status !== "boolean"
      ) {
        return res.status(400).json({
          error: "Status must be true or false"
        });
      }

      if (typeof data.name === "string") {
        data.name = data.name.trim();
      }

      if (typeof data.category === "string") {
        data.category = data.category.trim();
      }

      const game = await prisma.game.update({
        where: { id },
        data
      });

      return res.json(game);

    } catch (error) {
      console.error("Update game error:", error);

      if (error.code === "P2025") {
        return res.status(404).json({
          error: "Game not found"
        });
      }

      return res.status(500).json({
        error: "Failed to update game"
      });
    }
  }
);

// Delete a game — Admin only
router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "Invalid game ID"
        });
      }

      await prisma.game.delete({
        where: { id }
      });

      return res.status(204).send();

    } catch (error) {
      console.error("Delete game error:", error);

      if (error.code === "P2025") {
        return res.status(404).json({
          error: "Game not found"
        });
      }

      return res.status(500).json({
        error: "Failed to delete game"
      });
    }
  }
);

export default router;
