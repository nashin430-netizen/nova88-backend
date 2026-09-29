import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/dashboard", requireAuth, requireAdmin, async (req, res) => {
  res.json({
    message: "Admin access granted",
    admin: req.user
  });
});

export default router;
