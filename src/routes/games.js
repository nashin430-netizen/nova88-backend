import { Router } from "express";
import { prisma } from "../server.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Get all active games
router.get("/", async (req, res) => {
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

// Add a new game — Admin only
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category,
      icon,
      description,
      image
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({
        error: "Name and category are required"
      });
    }

    const game = await prisma.game.create({
      data: {
        name,
        category,
        icon,
        description,
        image
      }
    });

    res.status(201).json(game);

  } catch (error) {
    res.status(500).json({
      error: "Failed to create game"
    });
  }
});

// Update a game — Admin only
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
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
      Object.entries(req.body).filter(([key]) =>
        allowed.includes(key)
      )
    );

    const game = await prisma.game.update({
      where: { id },
      data
    });

    res.json(game);

  } catch (error) {
    res.status(500).json({
      error: "Failed to update game"
    });
  }
});

// Delete a game — Admin only
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid game ID"
      });
    }

    await prisma.game.delete({
      where: { id }
    });

    res.status(204).send();

  } catch (error) {
    res.status(500).json({
      error: "Failed to delete game"
    });
  }
});

export default router;
