import { Router } from "express";
import { prisma } from "../server.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// Get active promotions
router.get("/", async (req, res) => {
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

// Create promotion — Admin only
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  try {
    const { title, description, image } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: "Title and description are required"
      });
    }

    const promotion = await prisma.promotion.create({
      data: {
        title,
        description,
        image
      }
    });

    res.status(201).json(promotion);

  } catch (error) {
    res.status(500).json({
      error: "Failed to create promotion"
    });
  }
});

// Update promotion — Admin only
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid promotion ID"
      });
    }

    const allowed = [
      "title",
      "description",
      "image",
      "status"
    ];

    const data = Object.fromEntries(
      Object.entries(req.body).filter(([key]) =>
        allowed.includes(key)
      )
    );

    const promotion = await prisma.promotion.update({
      where: { id },
      data
    });

    res.json(promotion);

  } catch (error) {
    res.status(500).json({
      error: "Failed to update promotion"
    });
  }
});

// Delete promotion — Admin only
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        error: "Invalid promotion ID"
      });
    }

    await prisma.promotion.delete({
      where: { id }
    });

    res.status(204).send();

  } catch (error) {
    res.status(500).json({
      error: "Failed to delete promotion"
    });
  }
});

export default router;
