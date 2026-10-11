import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();

// ======================================
// USER: CREATE DEPOSIT REQUEST
// ======================================

router.post("/", requireAuth, async (req, res) => {
  try {
    const { amount, method, transactionId, note } = req.body || {};
    const depositAmount = Number(amount);

    if (
      amount === undefined ||
      amount === null ||
      amount === "" ||
      !Number.isFinite(depositAmount) ||
      depositAmount <= 0
    ) {
      return res.status(400).json({
        error: "Valid deposit amount is required"
      });
    }

    if (typeof method !== "string" || !method.trim()) {
      return res.status(400).json({
        error: "Deposit method is required"
      });
    }

    const deposit = await prisma.deposit.create({
      data: {
        userId: req.user.id,
        amount: depositAmount,
        method: method.trim(),
        transactionId:
          typeof transactionId === "string" && transactionId.trim()
            ? transactionId.trim()
            : null,
        note:
          typeof note === "string" && note.trim()
            ? note.trim()
            : null
      }
    });

    return res.status(201).json({
      message: "Deposit request submitted successfully",
      deposit: {
        id: deposit.id,
        amount: Number(deposit.amount),
        method: deposit.method,
        transactionId: deposit.transactionId,
        note: deposit.note,
        status: deposit.status,
        createdAt: deposit.createdAt
      }
    });
  } catch (error) {
    console.error("Create deposit error:", error);

    return res.status(500).json({
      error: "Failed to create deposit request"
    });
  }
});

// ======================================
// USER: MY DEPOSIT REQUESTS
// ======================================

router.get("/my", requireAuth, async (req, res) => {
  try {
    const [deposits, user] = await Promise.all([
      prisma.deposit.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" }
      }),
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { balance: true }
      })
    ]);

    return res.json({
      balance: user ? Number(user.balance) : 0,
      deposits: deposits.map((deposit) => ({
        id: deposit.id,
        amount: Number(deposit.amount),
        method: deposit.method,
        transactionId: deposit.transactionId,
        note: deposit.note,
        status: deposit.status,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt
      }))
    });
  } catch (error) {
    console.error("Load deposits error:", error);

    return res.status(500).json({
      error: "Failed to load deposits"
    });
  }
});

// ======================================
// ADMIN: ALL DEPOSIT REQUESTS
// ======================================

router.get("/admin", requireAuth, requireAdmin, async (req, res) => {
  try {
    const deposits = await prisma.deposit.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json({
      deposits: deposits.map((deposit) => ({
        id: deposit.id,
        user: deposit.user,
        amount: Number(deposit.amount),
        method: deposit.method,
        transactionId: deposit.transactionId,
        note: deposit.note,
        status: deposit.status,
        createdAt: deposit.createdAt,
        updatedAt: deposit.updatedAt
      }))
    });
  } catch (error) {
    console.error("Admin deposits error:", error);

    return res.status(500).json({
      error: "Failed to load deposit requests"
    });
  }
});

// ======================================
// ADMIN: APPROVE DEPOSIT
// ======================================

router.patch(
  "/admin/:id/approve",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "Invalid deposit ID"
        });
      }

      const result = await prisma.$transaction(async (tx) => {
        const deposit = await tx.deposit.findUnique({
          where: { id }
        });

        if (!deposit) {
          throw new Error("DEPOSIT_NOT_FOUND");
        }

        if (deposit.status !== "PENDING") {
          throw new Error("DEPOSIT_ALREADY_PROCESSED");
        }

        const updatedDeposit = await tx.deposit.updateMany({
          where: {
            id,
            status: "PENDING"
          },
          data: {
            status: "APPROVED"
          }
        });

        if (updatedDeposit.count !== 1) {
          throw new Error("DEPOSIT_ALREADY_PROCESSED");
        }

        const updatedUser = await tx.user.update({
          where: { id: deposit.userId },
          data: {
            balance: {
              increment: deposit.amount
            }
          },
          select: {
            balance: true
          }
        });

        return {
          deposit: {
            id: deposit.id,
            amount: Number(deposit.amount),
            status: "APPROVED"
          },
          balance: Number(updatedUser.balance)
        };
      });

      return res.json({
        message: "Deposit approved successfully",
        deposit: result.deposit,
        newBalance: result.balance
      });
    } catch (error) {
      console.error("Approve deposit error:", error);

      if (error.message === "DEPOSIT_NOT_FOUND") {
        return res.status(404).json({
          error: "Deposit not found"
        });
      }

      if (error.message === "DEPOSIT_ALREADY_PROCESSED") {
        return res.status(400).json({
          error: "This deposit has already been processed"
        });
      }

      return res.status(500).json({
        error: "Failed to approve deposit"
      });
    }
  }
);

// ======================================
// ADMIN: REJECT DEPOSIT
// ======================================

router.patch(
  "/admin/:id/reject",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = Number(req.params.id);

      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
          error: "Invalid deposit ID"
        });
      }

      const result = await prisma.deposit.updateMany({
        where: {
          id,
          status: "PENDING"
        },
        data: {
          status: "REJECTED"
        }
      });

      if (result.count === 0) {
        const existingDeposit = await prisma.deposit.findUnique({
          where: { id },
          select: { id: true }
        });

        if (!existingDeposit) {
          return res.status(404).json({
            error: "Deposit not found"
          });
        }

        return res.status(400).json({
          error: "This deposit has already been processed"
        });
      }

      return res.json({
        message: "Deposit rejected successfully",
        deposit: {
          id,
          status: "REJECTED"
        }
      });
    } catch (error) {
      console.error("Reject deposit error:", error);

      return res.status(500).json({
        error: "Failed to reject deposit"
      });
    }
  }
);

export default router;
