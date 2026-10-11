import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

// =====================================
// GET ALL GAMES - ADMIN
// =====================================

router.get("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const games = await prisma.game.findMany({
      orderBy: { createdAt: "desc" }
    });

    return res.json({ games });
  } catch (error) {
    console.error("Admin load games error:", error);

    return res.status(500).json({
      error: "Failed to load games"
    });
  }
});

// =====================================
// CREATE GAME - ADMIN
// =====================================

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      name,
      category,
      icon,
      description,
      image,
      status
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      typeof category !== "string" ||
      !category.trim()
    ) {
      return res.status(400).json({
        error: "Game name and category are required"
      });
    }

    if (status !== undefined && typeof status !== "boolean") {
      return res.status(400).json({
        error: "Status must be true or false"
      });
    }

    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        category: category.trim(),
        icon: typeof icon === "string" && icon.trim() ? icon.trim() : null,
        description:
          typeof description === "string" && description.trim()
            ? description.trim()
            : null,
        image: typeof image === "string" && image.trim() ? image.trim() : null,
        status: status === undefined ? true : status
      }
    });

    return res.status(201).json({
      message: "Game created successfully",
      game
    });
  } catch (error) {
    console.error("Admin create game error:", error);

    return res.status(500).json({
      error: "Failed to create game"
    });
  }
});

// =====================================
// UPDATE GAME - ADMIN
// =====================================

router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid game ID"
      });
    }

    const {
      name,
      category,
      icon,
      description,
      image,
      status
    } = req.body || {};

    const data = {};

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          error: "Game name cannot be empty"
        });
      }
      data.name = name.trim();
    }

    if (category !== undefined) {
      if (typeof category !== "string" || !category.trim()) {
        return res.status(400).json({
          error: "Game category cannot be empty"
        });
      }
      data.category = category.trim();
    }

    for (const field of ["icon", "description", "image"]) {
      if (req.body[field] !== undefined) {
        const value = req.body[field];

        if (value !== null && typeof value !== "string") {
          return res.status(400).json({
            error: `${field} must be text or null`
          });
        }

        data[field] =
          typeof value === "string" && value.trim()
            ? value.trim()
            : null;
      }
    }

    if (status !== undefined) {
      if (typeof status !== "boolean") {
        return res.status(400).json({
          error: "Status must be true or false"
        });
      }
      data.status = status;
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({
        error: "No valid fields provided for update"
      });
    }

    const game = await prisma.game.update({
      where: { id },
      data
    });

    return res.json({
      message: "Game updated successfully",
      game
    });
  } catch (error) {
    console.error("Admin update game error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Game not found"
      });
    }

    return res.status(500).json({
      error: "Failed to update game"
    });
  }
});

// =====================================
// DELETE GAME - ADMIN
// =====================================

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
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

    return res.json({
      message: "Game deleted successfully"
    });
  } catch (error) {
    console.error("Admin delete game error:", error);

    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Game not found"
      });
    }

    return res.status(500).json({
      error: "Failed to delete game"
    });
  }
});

export default router;
