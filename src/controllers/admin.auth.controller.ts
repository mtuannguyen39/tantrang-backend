import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";
import crypto from "crypto";

interface AuthenticatedRequest extends Request {
  admin?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

// Utility function to generate random API token
const generateApiToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

export const bootstrapSuperAdmin = async (req: Request, res: Response) => {
  try {
    // Check if any SUPER_ADMIN already exists
    const existingSuperAdmin = await prisma.admin.findFirst({
      where: { role: "SUPER_ADMIN" },
    });

    if (existingSuperAdmin) {
      return res.status(400).json({
        error: "Super Admin đã tồn tại! Không thể tạo thêm.",
      });
    }

    const { username, email, password, phoneNumber } = req.body;

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email và password là bắt buộc!",
      });
    }

    // Check if admin already exists with same username/email
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingAdmin) {
      return res.status(400).json({
        error: "Username hoặc email đã tồn tại!",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const apiToken = generateApiToken();

    // Create SUPER_ADMIN
    const superAdmin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        phoneNumber,
        apiToken,
        // No createdBy since this is the first admin
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        apiToken: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Tạo Super Admin đầu tiên thành công!",
      admin: superAdmin,
    });
  } catch (error) {
    console.error("Bootstrap super admin error:", error);
    return res.status(500).json({ error: "Lỗi Server!" });
  }
};

export const registerAdmin = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { username, email, password, role, phoneNumber } = req.body;
    const creatorAdmin = req.admin;

    // Check if creator is SUPER_ADMIN
    if (creatorAdmin?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: "Chỉ Super Admin mới có thể tạo tài khoản admin mới!",
      });
    }

    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Username, email & password is required!",
      });
    }

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existingAdmin) {
      return res.status(400).json({
        error: "Username hoặc email đã tồn tại!",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const apiToken = generateApiToken();

    // Create new Admin
    const newAdmin = await prisma.admin.create({
      data: {
        username,
        email,
        password: hashedPassword,
        role: role || "NEWS_ADMIN",
        phoneNumber,
        apiToken,
        createdBy: creatorAdmin.id,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        apiToken: true,
        isActive: true,
        createdAt: true,
      },
    });

    return res.status(201).json({
      message: "Tạo tài khoản admin thành công!",
      admin: newAdmin,
    });
  } catch (error) {
    console.error("🔥 Lỗi tạo tài khoản admin:", error);
    return res.status(500).json({ error: "Lỗi server!!!" });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        error: "Username và password là bắt buộc!!!",
      });
    }

    // Find admin by username or email
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        isActive: true,
      },
    });

    if (!admin) {
      return res.status(401).json({
        error: "Tài khoản không tồn tại hoặc đã bị vô hiệu hóa!!!",
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({
        error: "Mật khẩu không chính xác!",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET || "tantrang_secret_key",
      { expiresIn: "7d" }
    );

    // Return admin info and token
    return res.json({
      message: "Đăng nhập thành công!!!",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        phoneNumber: admin.phoneNumber,
        apiToken: admin.apiToken,
      },
    });
  } catch (error) {
    console.error("🔥 Lỗi đăng nhập:", error);
    return res.status(500).json({ error: "Lỗi server!!!" });
  }
};

export const getAdminProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const adminId = req.admin?.id;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        isActive: true,
        createdAt: true,
        apiToken: true,
      },
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin không tồn tại!!!" });
    }

    return res.json({ admin });
  } catch (error) {
    console.error("Get admin profile error:", error);
    return res.status(500).json({ error: "Lỗi server!!!" });
  }
};

export const updateAdminProfile = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const adminId = req.admin?.id;
    const { email, phoneNumber, currentPassword, newPassword } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      return res.status(404).json({ error: "Admin không tồn tại!!!" });
    }

    // Prepare update data
    const updateData: any = {};

    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    //Handle password change
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          error: "Cần nhập mật khẩu hiện tại để đổi sang mật khẩu mới!",
        });
      }
      const isValidPassword = await bcrypt.compare(
        currentPassword,
        admin.password
      );
      if (!isValidPassword) {
        return res
          .status(401)
          .json({ error: "Mật khẩu hiện tại không chính xác!!!" });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 12);
      updateData.password = hashedNewPassword;
    }

    // Update admin
    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        updatedAt: true,
        apiToken: true,
      },
    });
    return res.json({
      message: "Cập nhật thông tin thành công!",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("🔥 Lỗi ko lấy được thông tin tài khoản:", error);
    return res.status(500).json({ error: "Lỗi server!!!" });
  }
};

export const regenerateApiToken = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const adminId = req.admin?.id;
    const newApiToken = generateApiToken();

    const updatedAdmin = await prisma.admin.update({
      where: { id: adminId },
      data: {
        apiToken: newApiToken,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        apiToken: true,
      },
    });

    return res.json({
      message: "Tạo lại API token thành công!",
      admin: updatedAdmin,
    });
  } catch (error) {
    console.error("Regenerate API token error:", error);
    return res.status(500).json({ error: "Lỗi server!" });
  }
};

export const getAllAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const currentAdmin = req.admin;

    if (currentAdmin?.role !== "SUPER_ADMIN") {
      return res.status(403).json({
        error: "Chỉ có Admin tổng mới có thể xem danh sách của admin!",
      });
    }

    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        apiToken: true,
        isActive: true,
        createdAt: true,
        creator: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({ admins });
  } catch (error) {
    console.error("Get all admins error:", error);
    return res.status(500).json({ error: "Lỗi server!" });
  }
};

export const deleteAdmin = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { adminId } = req.params;
    const currentAdmin = req.admin;

    if (currentAdmin?.role !== "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ error: "Chỉ có ADMIN tổng mới có thể xóa admin!" });
    }

    // Cannot delete self
    if (currentAdmin.id === Number.parseInt(adminId)) {
      return res.status(400).json({ error: "Không thể xóa chính mình" });
    }

    const adminToDelete = await prisma.admin.findUnique({
      where: { id: Number.parseInt(adminId) },
    });

    if (!adminToDelete) {
      return res.status(404).json({ error: "Admin không tồn tại!" });
    }

    // Soft delete by setting isActive to false
    await prisma.admin.update({
      where: { id: Number.parseInt(adminId) },
      data: { isActive: false },
    });

    return res.json({ message: "Xóa admin thành công!" });
  } catch (error) {
    console.error("Delete admin error:", error);
    return res.status(500).json({ error: "Lỗi server!" });
  }
};
