import { Router } from "express";
import {
  requireAuth,
  requireAdmin
} from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = Router();

// =====================================
// HELPERS
// =====================================

function validId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function validStatus(status) {
  return typeof status === "boolean";
}

function handleNotFound(error, res, message) {
  if (error.code === "P2025") {
    return res.status(404).json({
      error: message
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "Internal server error"
  });
}

// =====================================
// PUBLIC: PAYMENT METHODS
// GET /api/settings/payment-methods
// =====================================

router.get("/payment-methods", async (req, res) => {
  try {
    const paymentMethods = await prisma.paymentMethod.findMany({
      where: { status: true },
      orderBy: { id: "asc" }
    });

    return res.json({ paymentMethods });
  } catch (error) {
    console.error("Payment methods error:", error);

    return res.status(500).json({
      error: "Failed to load payment methods"
    });
  }
});

// =====================================
// PUBLIC: SITE SETTINGS
// GET /api/settings/site
// =====================================

router.get("/site", async (req, res) => {
  try {
    const settings = await prisma.siteSetting.findUnique({
      where: { id: 1 }
    });

    return res.json({
      settings: settings || { logoUrl: null }
    });
  } catch (error) {
    console.error("Site settings error:", error);

    return res.status(500).json({
      error: "Failed to load site settings"
    });
  }
});

// =====================================
// PUBLIC: HOMEPAGE BANNERS
// GET /api/settings/banners
// =====================================

router.get("/banners", async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      where: { status: true },
      orderBy: [
        { sortOrder: "asc" },
        { id: "asc" }
      ]
    });

    return res.json({ banners });
  } catch (error) {
    console.error("Banners error:", error);

    return res.status(500).json({
      error: "Failed to load banners"
    });
  }
});

// =====================================
// ADMIN: GET ALL PAYMENT METHODS
// =====================================

router.get(
  "/admin/payment-methods",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const paymentMethods =
        await prisma.paymentMethod.findMany({
          orderBy: { id: "asc" }
        });

      return res.json({ paymentMethods });
    } catch (error) {
      console.error("Admin payment methods error:", error);

      return res.status(500).json({
        error: "Failed to load payment methods"
      });
    }
  }
);

// =====================================
// ADMIN: ADD PAYMENT METHOD
// =====================================

router.post(
  "/admin/payment-methods",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        details,
        icon,
        instructions,
        status
      } = req.body || {};

      if (
        typeof name !== "string" ||
        !name.trim() ||
        typeof details !== "string" ||
        !details.trim()
      ) {
        return res.status(400).json({
          error: "Payment method name and details are required"
        });
      }

      if (
        status !== undefined &&
        !validStatus(status)
      ) {
        return res.status(400).json({
          error: "Status must be true or false"
        });
      }

      const paymentMethod =
        await prisma.paymentMethod.create({
          data: {
            name: name.trim(),
            details: details.trim(),

            icon:
              typeof icon === "string" && icon.trim()
                ? icon.trim()
                : null,

            instructions:
              typeof instructions === "string" &&
              instructions.trim()
                ? instructions.trim()
                : null,

            status: status === undefined ? true : status
          }
        });

      return res.status(201).json({
        message: "Payment method added successfully",
        paymentMethod
      });
    } catch (error) {
      console.error("Add payment method error:", error);

      return res.status(500).json({
        error: "Failed to add payment method"
      });
    }
  }
);

// =====================================
// ADMIN: EDIT PAYMENT METHOD
// =====================================

router.patch(
  "/admin/payment-methods/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = validId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: "Invalid payment method ID"
        });
      }

      const {
        name,
        details,
        icon,
        instructions,
        status
      } = req.body || {};

      const data = {};

      if (name !== undefined) {
        if (
          typeof name !== "string" ||
          !name.trim()
        ) {
          return res.status(400).json({
            error: "Payment method name cannot be empty"
          });
        }

        data.name = name.trim();
      }

      if (details !== undefined) {
        if (
          typeof details !== "string" ||
          !details.trim()
        ) {
          return res.status(400).json({
            error: "Payment method details cannot be empty"
          });
        }

        data.details = details.trim();
      }

      if (icon !== undefined) {
        if (
          icon !== null &&
          typeof icon !== "string"
        ) {
          return res.status(400).json({
            error: "Icon must be text or null"
          });
        }

        data.icon =
          typeof icon === "string" && icon.trim()
            ? icon.trim()
            : null;
      }

      if (instructions !== undefined) {
        if (
          instructions !== null &&
          typeof instructions !== "string"
        ) {
          return res.status(400).json({
            error: "Instructions must be text or null"
          });
        }

        data.instructions =
          typeof instructions === "string" &&
          instructions.trim()
            ? instructions.trim()
            : null;
      }

      if (status !== undefined) {
        if (!validStatus(status)) {
          return res.status(400).json({
            error: "Status must be true or false"
          });
        }

        data.status = status;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          error: "No valid fields provided for update"
        });
      }

      const paymentMethod =
        await prisma.paymentMethod.update({
          where: { id },
          data
        });

      return res.json({
        message: "Payment method updated successfully",
        paymentMethod
      });
    } catch (error) {
      console.error("Edit payment method error:", error);

      return handleNotFound(
        error,
        res,
        "Payment method not found"
      );
    }
  }
);

// =====================================
// ADMIN: DELETE PAYMENT METHOD
// =====================================

router.delete(
  "/admin/payment-methods/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = validId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: "Invalid payment method ID"
        });
      }

      await prisma.paymentMethod.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: "Payment method deleted successfully"
      });
    } catch (error) {
      console.error("Delete payment method error:", error);

      return handleNotFound(
        error,
        res,
        "Payment method not found"
      );
    }
  }
);

// =====================================
// ADMIN: UPDATE SITE LOGO URL
// =====================================

router.patch(
  "/admin/site",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const body = req.body || {};

      if (
        !Object.prototype.hasOwnProperty.call(
          body,
          "logoUrl"
        )
      ) {
        return res.status(400).json({
          error: "Logo URL field is required"
        });
      }

      const { logoUrl } = body;

      if (
        logoUrl !== null &&
        typeof logoUrl !== "string"
      ) {
        return res.status(400).json({
          error: "Logo URL must be text or null"
        });
      }

      const normalizedLogoUrl =
        typeof logoUrl === "string" && logoUrl.trim()
          ? logoUrl.trim()
          : null;

      const settings = await prisma.siteSetting.upsert({
        where: { id: 1 },

        update: {
          logoUrl: normalizedLogoUrl
        },

        create: {
          id: 1,
          logoUrl: normalizedLogoUrl
        }
      });

      return res.json({
        message: "Site settings updated successfully",
        settings
      });
    } catch (error) {
      console.error("Update site settings error:", error);

      return res.status(500).json({
        error: "Failed to update site settings"
      });
    }
  }
);

// =====================================
// ADMIN: GET ALL BANNERS
// =====================================

router.get(
  "/admin/banners",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const banners = await prisma.banner.findMany({
        orderBy: [
          { sortOrder: "asc" },
          { id: "asc" }
        ]
      });

      return res.json({ banners });
    } catch (error) {
      console.error("Admin banners error:", error);

      return res.status(500).json({
        error: "Failed to load banners"
      });
    }
  }
);

// =====================================
// ADMIN: ADD BANNER
// =====================================

router.post(
  "/admin/banners",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const {
        title,
        imageUrl,
        linkUrl,
        status,
        sortOrder
      } = req.body || {};

      if (
        typeof title !== "string" ||
        !title.trim() ||
        typeof imageUrl !== "string" ||
        !imageUrl.trim()
      ) {
        return res.status(400).json({
          error: "Banner title and image URL are required"
        });
      }

      if (
        status !== undefined &&
        !validStatus(status)
      ) {
        return res.status(400).json({
          error: "Status must be true or false"
        });
      }

      if (
        linkUrl !== undefined &&
        linkUrl !== null &&
        typeof linkUrl !== "string"
      ) {
        return res.status(400).json({
          error: "Banner link must be text or null"
        });
      }

      const parsedSortOrder =
        sortOrder === undefined
          ? 0
          : Number(sortOrder);

      if (!Number.isInteger(parsedSortOrder)) {
        return res.status(400).json({
          error: "Sort order must be an integer"
        });
      }

      const banner = await prisma.banner.create({
        data: {
          title: title.trim(),
          imageUrl: imageUrl.trim(),

          linkUrl:
            typeof linkUrl === "string" &&
            linkUrl.trim()
              ? linkUrl.trim()
              : null,

          status: status === undefined ? true : status,
          sortOrder: parsedSortOrder
        }
      });

      return res.status(201).json({
        message: "Banner added successfully",
        banner
      });
    } catch (error) {
      console.error("Add banner error:", error);

      return res.status(500).json({
        error: "Failed to add banner"
      });
    }
  }
);

// =====================================
// ADMIN: EDIT BANNER
// =====================================

router.patch(
  "/admin/banners/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = validId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: "Invalid banner ID"
        });
      }

      const {
        title,
        imageUrl,
        linkUrl,
        status,
        sortOrder
      } = req.body || {};

      const data = {};

      if (title !== undefined) {
        if (
          typeof title !== "string" ||
          !title.trim()
        ) {
          return res.status(400).json({
            error: "Banner title cannot be empty"
          });
        }

        data.title = title.trim();
      }

      if (imageUrl !== undefined) {
        if (
          typeof imageUrl !== "string" ||
          !imageUrl.trim()
        ) {
          return res.status(400).json({
            error: "Banner image URL cannot be empty"
          });
        }

        data.imageUrl = imageUrl.trim();
      }

      if (linkUrl !== undefined) {
        if (
          linkUrl !== null &&
          typeof linkUrl !== "string"
        ) {
          return res.status(400).json({
            error: "Banner link must be text or null"
          });
        }

        data.linkUrl =
          typeof linkUrl === "string" && linkUrl.trim()
            ? linkUrl.trim()
            : null;
      }

      if (status !== undefined) {
        if (!validStatus(status)) {
          return res.status(400).json({
            error: "Status must be true or false"
          });
        }

        data.status = status;
      }

      if (sortOrder !== undefined) {
        const parsedSortOrder = Number(sortOrder);

        if (!Number.isInteger(parsedSortOrder)) {
          return res.status(400).json({
            error: "Sort order must be an integer"
          });
        }

        data.sortOrder = parsedSortOrder;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({
          error: "No valid fields provided for update"
        });
      }

      const banner = await prisma.banner.update({
        where: { id },
        data
      });

      return res.json({
        message: "Banner updated successfully",
        banner
      });
    } catch (error) {
      console.error("Edit banner error:", error);

      return handleNotFound(
        error,
        res,
        "Banner not found"
      );
    }
  }
);

// =====================================
// ADMIN: DELETE BANNER
// =====================================

router.delete(
  "/admin/banners/:id",
  requireAuth,
  requireAdmin,
  async (req, res) => {
    try {
      const id = validId(req.params.id);

      if (!id) {
        return res.status(400).json({
          error: "Invalid banner ID"
        });
      }

      await prisma.banner.delete({
        where: { id }
      });

      return res.json({
        success: true,
        message: "Banner deleted successfully"
      });
    } catch (error) {
      console.error("Delete banner error:", error);

      return handleNotFound(
        error,
        res,
        "Banner not found"
      );
    }
  }
);

export default router;
