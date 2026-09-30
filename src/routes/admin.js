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

// ===============================
// CHANGE USER ROLE
// ===============================

router.patch(
"/users/:id/role",
requireAuth,
requireAdmin,
async (req, res) => {

try {

  const userId =
    Number(req.params.id);

  const { role } = req.body;


  if (!["USER", "ADMIN"].includes(role)) {

    return res.status(400).json({
      error: "Invalid role"
    });

  }


  // Prevent admin from changing their own role

  if (userId === req.user.id) {

    return res.status(400).json({
      error: "You cannot change your own role"
    });

  }


  const user =
    await prisma.user.update({
      where: {
        id: userId
      },

      data: {
        role: role
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });


  res.json({
    message: "User role updated successfully",
    user
  });


} catch (error) {

  console.error(
    "CHANGE ROLE ERROR:",
    error
  );

  res.status(500).json({
    error: "Failed to update user role"
  });

}

}
);

// ===============================
// DELETE USER
// ===============================

router.delete(
"/users/:id",
requireAuth,
requireAdmin,
async (req, res) => {

try {

  const userId =
    Number(req.params.id);


  // Prevent admin from deleting themselves

  if (userId === req.user.id) {

    return res.status(400).json({
      error: "You cannot delete yourself"
    });

  }


  await prisma.user.delete({
    where: {
      id: userId
    }
  });


  res.json({
    message: "User deleted successfully"
  });


} catch (error) {

  console.error(
    "DELETE USER ERROR:",
    error
  );

  res.status(500).json({
    error: "Failed to delete user"
  });

}

}
);

export default router;
