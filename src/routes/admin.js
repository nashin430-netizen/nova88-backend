import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../server.js";

const router = Router();


// ===============================
// ADMIN DASHBOARD
// ===============================

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


// ===============================
// GET ALL USERS
// ===============================

router.get(
  "/users",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {

      const users = await prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        },
        orderBy: {
          id: "desc"
        }
      });

      res.json({
        users
      });

    } catch (error) {

      console.error("ADMIN USERS ERROR:", error);

      res.status(500).json({
        error: "Failed to load users"
      });

    }
  }
);


export default router;
