import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../server.js";

const router = Router();


// =====================================
// GET ALL GAMES
// =====================================

router.get(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {

      const games = await prisma.game.findMany({
        orderBy: {
          createdAt: "desc"
        }
      });

      res.json({
        games
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to load games"
      });

    }
  }
);


// =====================================
// CREATE GAME
// =====================================

router.post(
  "/",
  requireAuth,
  requireAdmin,
  async (req, res) => {

    try {

      const {
        name,
        category,
        icon,
        description,
        image,
        status
      } = req.body;


      if (!name || !category) {

        return res.status(400).json({
          error: "Game name and category are required"
        });

      }


      const game = await prisma.game.create({
        data: {
          name,
          category,
          icon: icon || null,
          description: description || null,
          image: image || null,
          status:
            typeof status === "boolean"
              ? status
              : true
        }
      });


      res.status(201).json({
        message: "Game created successfully",
        game
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to create game"
      });

    }

  }
);


// =====================================
// UPDATE GAME
// =====================================

router.patch(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (!Number.isInteger(id)) {

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
      } = req.body;


      const game =
        await prisma.game.update({
          where: {
            id
          },

          data: {
            ...(name !== undefined && { name }),
            ...(category !== undefined && { category }),
            ...(icon !== undefined && { icon }),
            ...(description !== undefined && { description }),
            ...(image !== undefined && { image }),
            ...(status !== undefined && { status })
          }
        });


      res.json({
        message: "Game updated successfully",
        game
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to update game"
      });

    }

  }
);


// =====================================
// DELETE GAME
// =====================================

router.delete(
  "/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {

    try {

      const id =
        Number(req.params.id);


      if (!Number.isInteger(id)) {

        return res.status(400).json({
          error: "Invalid game ID"
        });

      }


      await prisma.game.delete({
        where: {
          id
        }
      });


      res.json({
        message: "Game deleted successfully"
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        error: "Failed to delete game"
      });

    }

  }
);


export default router;
