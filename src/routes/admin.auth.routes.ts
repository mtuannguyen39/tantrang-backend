import express from "express";
import type { Request, Response } from "express";
import { AuthService } from "../services/auth.service";
import { AdminService } from "../services/admin.service";
import { ValidationService } from "../services/validation.service";
import {
  authenticateAdmin,
  authorizeRoles,
} from "../middlewares/auth.middleware";
import type { AuthenticatedRequest } from "../types/admin.types";

const router = express.Router();

// POST /api/admin/auth/bootstrap - Create first SUPER_ADMIN (only works if no SUPER_ADMIN exists)
router.post("/bootstrap", async (req: Request, res: Response) => {
  try {
    const { username, email, password, phoneNumber } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email và password là bắt buộc!",
      });
    }

    // Check if any SUPER_ADMIN already exists
    const existingSuperAdmin = await AdminService.getSuperAdminCount();
    if (existingSuperAdmin > 0) {
      return res.status(400).json({
        error: "Super Admin đã tồn tại! Không thể tạo thêm.",
      });
    }

    // Validate input data
    const validationErrors = ValidationService.validateAdminData({
      username,
      email,
      password,
      phoneNumber,
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: "Dữ liệu không hợp lệ!",
        details: validationErrors,
      });
    }

    const superAdmin = await AdminService.createSuperAdmin({
      username,
      email,
      password,
      phoneNumber,
    });

    return res.status(201).json({
      message: "Tạo Super Admin đầu tiên thành công!",
      admin: superAdmin,
    });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

// POST /api/admin/auth/login
router.post(
  "/login",
  async (req: Request, res: Response): Promise<Response> => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: "Username và password là bắt buộc!",
        });
      }

      const result = await AuthService.login({ username, password });

      return res.json({
        message: "Đăng nhập thành công!",
        ...result,
      });
    } catch (error: any) {
      return res.status(401).json({ error: error.message });
    }
  }
);

// POST /api/admin/auth/register (Only SUPER_ADMIN)
router.post(
  "/register",
  authenticateAdmin,
  authorizeRoles("SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { username, email, password, role, phoneNumber } = req.body;

      // Validate input data
      const validationErrors = ValidationService.validateAdminData({
        username,
        email,
        password,
        phoneNumber,
        role,
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ!",
          details: validationErrors,
        });
      }

      const admin = await AdminService.createAdmin({
        username,
        email,
        password,
        role,
        phoneNumber,
        createdBy: authenticatedReq.admin!.id,
      });

      return res.status(201).json({
        message: "Tạo tài khoản admin thành công!",
        admin,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
);

// GET /api/admin/auth/profile
router.get(
  "/profile",
  authenticateAdmin,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const admin = await AdminService.getAdminById(authenticatedReq.admin!.id);
      return res.json({ admin });
    } catch (error: any) {
      return res.status(404).json({ error: error.message });
    }
  }
);

// PUT /api/admin/auth/profile
router.put(
  "/profile",
  authenticateAdmin,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { email, phoneNumber } = req.body;

      // Validate input data
      const validationErrors = ValidationService.validateAdminData({
        email,
        phoneNumber,
      });

      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Dữ liệu không hợp lệ!",
          details: validationErrors,
        });
      }

      const updatedAdmin = await AdminService.updateAdmin(
        authenticatedReq.admin!.id,
        {
          email,
          phoneNumber,
        }
      );

      return res.json({
        message: "Cập nhật thông tin thành công!",
        admin: updatedAdmin,
      });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
);

// PUT /api/admin/auth/change-password
router.put(
  "/change-password",
  authenticateAdmin,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          error: "Mật khẩu hiện tại và mật khẩu mới là bắt buộc!",
        });
      }

      // Validate new password
      const passwordErrors = ValidationService.validatePassword(newPassword);
      if (passwordErrors.length > 0) {
        return res.status(400).json({
          error: "Mật khẩu mới không hợp lệ!",
          details: passwordErrors,
        });
      }

      const result = await AuthService.changePassword(
        authenticatedReq.admin!.id,
        {
          currentPassword,
          newPassword,
        }
      );

      return res.json(result);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }
);

// POST /api/admin/auth/verify-token
router.post("/verify-token", async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Token là bắt buộc!" });
    }

    const admin = await AuthService.verifyToken(token);
    return res.json({ valid: true, admin });
  } catch (error: any) {
    return res.status(401).json({ valid: false, error: error.message });
  }
});

// POST /api/admin/auth/regenerate-token
router.post(
  "/regenerate-token",
  authenticateAdmin,
  async (req: Request, res: Response) => {
    const authenticatedReq = req as AuthenticatedRequest;
    try {
      const result = await AdminService.regenerateApiToken(
        authenticatedReq.admin!.id
      );

      return res.json({
        message: "Tạo lại API token thành công!",
        admin: result,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
);

export default router;
