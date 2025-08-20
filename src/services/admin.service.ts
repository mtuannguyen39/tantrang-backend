import bcrypt from "bcryptjs";
import crypto from "crypto";
import prisma from "../prisma/client";
import type { AdminRole } from "@prisma/client";

export interface CreateAdminData {
  username: string;
  email: string;
  password: string;
  role?: AdminRole;
  phoneNumber?: string;
  createdBy: number;
}

export interface UpdateAdminData {
  email?: string;
  phoneNumber?: string;
  role?: AdminRole;
  isActive?: boolean;
}

export interface CreateSuperAdminData {
  username: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export class AdminService {
  private static generateApiToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  static async getSuperAdminCount(): Promise<number> {
    return await prisma.admin.count({
      where: {
        role: "SUPER_ADMIN",
        isActive: true,
      },
    });
  }

  static async createSuperAdmin(data: CreateSuperAdminData) {
    // Check if any SUPER_ADMIN already exists
    const existingSuperAdmin = await this.getSuperAdminCount();
    if (existingSuperAdmin > 0) {
      throw new Error("Super Admin đã tồn tại! Không thể tạo thêm.");
    }

    // Check if admin already exists with same username/email
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingAdmin) {
      throw new Error("Username hoặc email đã tồn tại!");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const apiToken = this.generateApiToken();

    // Create SUPER_ADMIN
    const superAdmin = await prisma.admin.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        role: "SUPER_ADMIN",
        phoneNumber: data.phoneNumber,
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
        isActive: true,
        createdAt: true,
      },
    });

    return superAdmin;
  }

  static async createAdmin(data: CreateAdminData) {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [{ username: data.username }, { email: data.email }],
      },
    });

    if (existingAdmin) {
      throw new Error("Username hoặc email đã tồn tại!");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    const apiToken = this.generateApiToken();

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        ...data,
        password: hashedPassword,
        role: data.role || "NEWS_ADMIN",
        apiToken, // Include API token in creation
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        apiToken: true, // Include API token in response
        isActive: true,
        createdAt: true,
        creator: {
          select: {
            username: true,
          },
        },
      },
    });

    return admin;
  }

  static async getAdminById(id: number) {
    const admin = await prisma.admin.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        apiToken: true, // Include API token in response
        isActive: true,
        createdAt: true,
        updatedAt: true,
        creator: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!admin) {
      throw new Error("Admin không tồn tại!");
    }

    return admin;
  }

  static async getAllAdmins(includeInactive = false) {
    const whereClause = includeInactive ? {} : { isActive: true };

    const admins = await prisma.admin.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        apiToken: true, // Include API token in admin list
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

    return admins;
  }

  static async updateAdmin(id: number, data: UpdateAdminData) {
    // Check if admin exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!existingAdmin) {
      throw new Error("Admin không tồn tại!");
    }

    // Check email uniqueness if updating email
    if (data.email && data.email !== existingAdmin.email) {
      const emailExists = await prisma.admin.findFirst({
        where: {
          email: data.email,
          id: { not: id },
        },
      });

      if (emailExists) {
        throw new Error("Email đã được sử dụng bởi admin khác!");
      }
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        apiToken: true, // Include API token in response
        isActive: true,
        updatedAt: true,
      },
    });

    return updatedAdmin;
  }

  static async regenerateApiToken(id: number) {
    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new Error("Admin không tồn tại!");
    }

    const newApiToken = this.generateApiToken();

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: { apiToken: newApiToken },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        phoneNumber: true,
        apiToken: true,
        updatedAt: true,
      },
    });

    return updatedAdmin;
  }

  static async deleteAdmin(id: number, deletedBy: number) {
    // Cannot delete self
    if (id === deletedBy) {
      throw new Error("Không thể xóa chính mình!");
    }

    const admin = await prisma.admin.findUnique({
      where: { id },
    });

    if (!admin) {
      throw new Error("Admin không tồn tại!");
    }

    // Soft delete
    await prisma.admin.update({
      where: { id },
      data: { isActive: false },
    });

    return { message: "Xóa admin thành công!" };
  }

  static async getAdminStats() {
    const [totalAdmins, activeAdmins, adminsByRole] = await Promise.all([
      prisma.admin.count(),
      prisma.admin.count({ where: { isActive: true } }),
      prisma.admin.groupBy({
        by: ["role"],
        _count: {
          role: true,
        },
        where: { isActive: true },
      }),
    ]);

    return {
      totalAdmins,
      activeAdmins,
      inactiveAdmins: totalAdmins - activeAdmins,
      adminsByRole: adminsByRole.reduce((acc, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}
