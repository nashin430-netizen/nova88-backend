import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../server.js";

const router = Router();

router.get(
  "/dashboard",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const userCount = await prisma.user.count();

      res.json({
        message: "Admin access granted",

        admin: req.user,

        stats: {
          users: userCount,
          games: 0,
          promotions: 0
        }
      });

    } catch (error) {
      console.error("ADMIN DASHBOARD ERROR:", error);

      res.status(500).json({
        error: "Failed to load admin dashboard"
      });
    }
  }
);

export default router;
