import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();


// ==============================
// REGISTER
// ==============================

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      password.length < 8
    ) {
      return res.status(400).json({
        error:
          "Name, valid email and password of at least 8 characters are required"
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const exists = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      }
    });

    if (exists) {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash
      }
    });

    return res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Email already registered"
      });
    }

    return res.status(500).json({
      error: "Registration failed"
    });
  }
});


// ==============================
// LOGIN
// ==============================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        error: "Email and password are required"
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.trim().toLowerCase()
      }
    });

    if (
      !user ||
      !(await bcrypt.compare(password, user.passwordHash))
    ) {
      return res.status(401).json({
        error: "Invalid email or password"
      });
    }

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured");

      return res.status(500).json({
        error: "Server configuration error"
      });
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "2h"
      }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      error: "Login failed"
    });
  }
});


// ==============================
// CURRENT USER
// ==============================

router.get("/me", requireAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    return res.json({
      user
    });

  } catch (error) {
    console.error("LOAD CURRENT USER ERROR:", error);

    return res.status(500).json({
      error: "Failed to load user"
    });
  }
});


export default router;
