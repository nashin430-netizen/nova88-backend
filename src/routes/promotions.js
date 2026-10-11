import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import {
requireAuth,
requireAdmin
} from "../middleware/auth.js";

const router = Router();

// GET active promotions
router.get("/", async (req, res) => {
try {
const promotions = await prisma.promotion.findMany({
where: {
status: true
},
orderBy: {
createdAt: "desc"
}
});

return res.json(promotions);

} catch (error) {
console.error("LOAD PROMOTIONS ERROR:", error);

return res.status(500).json({
  error: "Failed to load promotions"
});

}
});

// CREATE promotion — Admin only
router.post(
"/",
requireAuth,
requireAdmin,
async (req, res) => {
try {
const {
title,
description,
image,
status
} = req.body || {};

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof description !== "string" ||
    !description.trim()
  ) {
    return res.status(400).json({
      error: "Title and description are required"
    });
  }

  const promotion = await prisma.promotion.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      image,
      ...(typeof status === "boolean"
        ? { status }
        : {})
    }
  });

  return res.status(201).json(promotion);

} catch (error) {
  console.error("CREATE PROMOTION ERROR:", error);

  return res.status(500).json({
    error: "Failed to create promotion"
  });
}

}
);

// UPDATE promotion — Admin only
router.patch(
"/:id",
requireAuth,
requireAdmin,
async (req, res) => {
try {
const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
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
    Object.entries(req.body || {}).filter(
      ([key]) => allowed.includes(key)
    )
  );

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      error: "No valid fields provided"
    });
  }

  if (
    "title" in data &&
    (
      typeof data.title !== "string" ||
      !data.title.trim()
    )
  ) {
    return res.status(400).json({
      error: "Title cannot be empty"
    });
  }

  if (
    "description" in data &&
    (
      typeof data.description !== "string" ||
      !data.description.trim()
    )
  ) {
    return res.status(400).json({
      error: "Description cannot be empty"
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

  if (typeof data.title === "string") {
    data.title = data.title.trim();
  }

  if (typeof data.description === "string") {
    data.description = data.description.trim();
  }

  const promotion = await prisma.promotion.update({
    where: { id },
    data
  });

  return res.json(promotion);

} catch (error) {
  console.error("UPDATE PROMOTION ERROR:", error);

  if (error.code === "P2025") {
    return res.status(404).json({
      error: "Promotion not found"
    });
  }

  return res.status(500).json({
    error: "Failed to update promotion"
  });
}

}
);

// DELETE promotion — Admin only
router.delete(
"/:id",
requireAuth,
requireAdmin,
async (req, res) => {
try {
const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "Invalid promotion ID"
    });
  }

  await prisma.promotion.delete({
    where: { id }
  });

  return res.status(204).send();

} catch (error) {
  console.error("DELETE PROMOTION ERROR:", error);

  if (error.code === "P2025") {
    return res.status(404).json({
      error: "Promotion not found"
    });
  }

  return res.status(500).json({
    error: "Failed to delete promotion"
  });
}

}
);

export default router;
