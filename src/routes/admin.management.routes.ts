import express from "express";
import type { Request, Response } from "express";
import { AdminService } from "../services/admin.service";
import { ValidationService } from "../services/validation.service";
import {
  authenticateAdmin,
  authorizeRoles,
} from "../middlewares/auth.middleware";

const router = express.Router();

interface AuthenticatedRequest extends Request {
  admin?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// GET /api/admin/management/admins (Only SUPER_ADMIN)
router.get(
  "/admins",
  authenticateAdmin,
  authorizeRoles("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const admins = await AdminService.getAllAdmins(includeInactive);
      return res.json({ admins });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

// GET /api/admin/management/admins/:id (Only SUPER_ADMIN)
router.get(
  "/admins/:id",
  authenticateAdmin,
  authorizeRoles("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const adminId = Number.parseInt(req.params.id);
      const admin = await AdminService.getAdminById(adminId);
      return res.json({ admin });
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }
);

// PUT /api/admin/management/admins/:id (Only SUPER_ADMIN)
router.put(
  "/admins/:id",
  authenticateAdmin,
  authorizeRoles("SUPER_ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = Number.parseInt(req.params.id);
      const { email, phoneNumber, role, isActive } = req.body;

      // Validate input data
      const validationErrors = ValidationService.validateAdminData({
        email,
        phoneNumber,
        role,
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ!",
          details: validationErrors,
        });
      }

      // Cannot change own role or status
      if (adminId === req.admin!.id && (role || isActive !== undefined)) {
        return res.status(400).json({
          error: "Không thể thay đổi role hoặc trạng thái của chính mình!",
        });
      }

      const updatedAdmin = await AdminService.updateAdmin(adminId, {
        email,
        phoneNumber,
        role,
        isActive,
      });

      return res.json({
        message: "Cập nhật admin thành công!",
        admin: updatedAdmin,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
);

// DELETE /api/admin/management/admins/:id (Only SUPER_ADMIN)
router.delete(
  "/admins/:id",
  authenticateAdmin,
  authorizeRoles("SUPER_ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const adminId = Number.parseInt(req.params.id);
      const result = await AdminService.deleteAdmin(adminId, req.admin!.id);
      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
);

// GET /api/admin/management/stats (Only SUPER_ADMIN)
router.get(
  "/stats",
  authenticateAdmin,
  authorizeRoles("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    try {
      const stats = await AdminService.getAdminStats();
      return res.json(stats);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;
