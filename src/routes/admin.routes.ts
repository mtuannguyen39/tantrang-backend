import express from "express";
import type { Request, Response } from "express";
import prisma from "../prisma/client";
import { authenticateAdmin } from "../middlewares/auth.middleware";
import adminAuthRoutes from "./admin.auth.routes";
import adminManagementRoutes from "./admin.management.routes";

const router = express.Router();

// Mount sub-routes
router.use("/auth", adminAuthRoutes);
router.use("/management", adminManagementRoutes);

// GET /api/admin/dashboard-stats (All authenticated admins)
router.get(
  "/dashboard-stats",
  authenticateAdmin,
  async (req: Request, res: Response) => {
    try {
      const [newsCount, tnttCount, bibleCount, liturgicalYearCount] =
        await Promise.all([
          prisma.news.count(),
          prisma.tNTT.count(),
          prisma.bibleReading.count(),
          prisma.liturgicalYear.count(),
        ]);

      return res.json({
        liturgicalYearCount,
        newsCount,
        tnttCount,
        bibleCount,
      });
    } catch (error) {
      return res.status(500).json({ error: "Lỗi Server!" });
    }
  }
);

// GET /api/admin/permissions (All authenticated admins)
router.get(
  "/permissions",
  authenticateAdmin,
  async (req: any, res: Response) => {
    try {
      const admin = req.admin;
      const permissions = {
        canManageAdmins: admin.role === "SUPER_ADMIN",
        canManageNews:
          admin.role === "SUPER_ADMIN" || admin.role === "NEWS_ADMIN",
        canManageTntt:
          admin.role === "SUPER_ADMIN" || admin.role === "TNTT_ADMIN",
        canManageBible:
          admin.role === "SUPER_ADMIN" || admin.role === "BIBLE_ADMIN",
        canViewStats: admin.role === "SUPER_ADMIN",
      };

      return res.json({ permissions });
    } catch (error) {
      return res.status(500).json({ error: "Lỗi Server!" });
    }
  }
);

export default router;
