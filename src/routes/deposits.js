import { Router } from "express";
import { prisma } from "../server.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = Router();


// ======================================
// USER: CREATE DEPOSIT REQUEST
// ======================================

router.post(
  "/",
  requireAuth,
  async (req, res) => {
    try {

      const {
        amount,
        method,
        transactionId,
        note
      } = req.body;

      const depositAmount = Number(amount);

      if (
        !depositAmount ||
        depositAmount <= 0
      ) {
        return res.status(400).json({
          error: "Valid deposit amount is required"
        });
      }

      if (!method || !String(method).trim()) {
        return res.status(400).json({
          error: "Deposit method is required"
        });
      }

      const deposit = await prisma.deposit.create({
        data: {
          userId: req.user.id,
          amount: depositAmount,
          method: String(method).trim(),
          transactionId:
            transactionId
              ? String(transactionId).trim()
              : null,
          note:
            note
              ? String(note).trim()
              : null
        }
      });

      res.status(201).json({
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

      console.error(
        "Create deposit error:",
        error
      );

      res.status(500).json({
        error: "Failed to create deposit request"
      });

    }
  }
);


// ======================================
// USER: MY DEPOSIT REQUESTS
// ======================================

router.get(
  "/my",
  requireAuth,
  async (req, res) => {
    try {

      const deposits =
        await prisma.deposit.findMany({
          where: {
            userId: req.user.id
          },
          orderBy: {
            createdAt: "desc"
          }
        });

      const user =
        await prisma.user.findUnique({
          where: {
            id: req.user.id
          },
          select: {
            balance: true
          }
        });

      res.json({
        balance:
          user
            ? Number(user.balance)
            : 0,

        deposits:
          deposits.map((deposit) => ({
            id: deposit.id,
            amount: Number(deposit.amount),
            method: deposit.method,
            transactionId:
              deposit.transactionId,
            note: deposit.note,
            status: deposit.status,
            createdAt: deposit.createdAt,
            updatedAt: deposit.updatedAt
          }))
      });

    } catch (error) {

      console.error(
        "Load deposits error:",
        error
      );

      res.status(500).json({
        error: "Failed to load deposits"
      });

    }
  }
);


// ======================================
// ADMIN: ALL DEPOSIT REQUESTS
// ======================================

router.get(
  "/admin",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {

      const deposits =
        await prisma.deposit.findMany({
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: {
            createdAt: "desc"
          }
        });

      res.json({
        deposits:
          deposits.map((deposit) => ({
            id: deposit.id,

            user: deposit.user,

            amount:
              Number(deposit.amount),

            method:
              deposit.method,

            transactionId:
              deposit.transactionId,

            note:
              deposit.note,

            status:
              deposit.status,

            createdAt:
              deposit.createdAt,

            updatedAt:
              deposit.updatedAt
          }))
      });

    } catch (error) {

      console.error(
        "Admin deposits error:",
        error
      );

      res.status(500).json({
        error: "Failed to load deposit requests"
      });

    }
  }
);


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

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: "Invalid deposit ID"
        });
      }

      const result =
        await prisma.$transaction(
          async (tx) => {

            const deposit =
              await tx.deposit.findUnique({
                where: { id }
              });

            if (!deposit) {
              throw new Error(
                "DEPOSIT_NOT_FOUND"
              );
            }

            if (
              deposit.status !== "PENDING"
            ) {
              throw new Error(
                "DEPOSIT_ALREADY_PROCESSED"
              );
            }

            const updatedDeposit =
              await tx.deposit.update({
                where: { id },
                data: {
                  status: "APPROVED"
                }
              });

            const updatedUser =
              await tx.user.update({
                where: {
                  id: deposit.userId
                },
                data: {
                  balance: {
                    increment:
                      deposit.amount
                  }
                }
              });

            return {
              deposit:
                updatedDeposit,

              balance:
                updatedUser.balance
            };
          }
        );

      res.json({
        message:
          "Deposit approved successfully",

        deposit: {
          id:
            result.deposit.id,

          amount:
            Number(
              result.deposit.amount
            ),

          status:
            result.deposit.status
        },

        newBalance:
          Number(result.balance)
      });

    } catch (error) {

      console.error(
        "Approve deposit error:",
        error
      );

      if (
        error.message ===
        "DEPOSIT_NOT_FOUND"
      ) {
        return res.status(404).json({
          error: "Deposit not found"
        });
      }

      if (
        error.message ===
        "DEPOSIT_ALREADY_PROCESSED"
      ) {
        return res.status(400).json({
          error:
            "This deposit has already been processed"
        });
      }

      res.status(500).json({
        error:
          "Failed to approve deposit"
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

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          error: "Invalid deposit ID"
        });
      }

      const deposit =
        await prisma.deposit.findUnique({
          where: { id }
        });

      if (!deposit) {
        return res.status(404).json({
          error: "Deposit not found"
        });
      }

      if (
        deposit.status !== "PENDING"
      ) {
        return res.status(400).json({
          error:
            "This deposit has already been processed"
        });
      }

      const updatedDeposit =
        await prisma.deposit.update({
          where: { id },
          data: {
            status: "REJECTED"
          }
        });

      res.json({
        message:
          "Deposit rejected successfully",

        deposit: {
          id:
            updatedDeposit.id,

          amount:
            Number(
              updatedDeposit.amount
            ),

          status:
            updatedDeposit.status
        }
      });

    } catch (error) {

      console.error(
        "Reject deposit error:",
        error
      );

      res.status(500).json({
        error:
          "Failed to reject deposit"
      });

    }
  }
);


export default router;
