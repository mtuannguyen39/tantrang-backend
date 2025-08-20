import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  static async login(credentials: LoginCredentials) {
    const { username, password } = credentials;

    console.log("[DEBUG] Login attempt for username:", username);
    console.log("[DEBUG] Password length:", password.length);

    // Find admin by username or email
    const admin = await prisma.admin.findFirst({
      where: {
        OR: [{ username }, { email: username }],
        isActive: true,
      },
    });

    if (!admin) {
      console.log("[DEBUG] Admin not found for username:", username);
      throw new Error("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa!");
    }

    console.log("[DEBUG] Found admin:", admin.username);
    console.log("[DEBUG] Admin password hash:", admin.password);
    console.log("[DEBUG] Input password:", password);

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    console.log("[DEBUG] Password comparison result:", isValidPassword);

    if (!isValidPassword) {
      console.log("[DEBUG] Password verification failed");
      throw new Error("Mật khẩu không chính xác!");
    }

    console.log("[DEBUG] Login successful for:", admin.username);

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

    return {
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        role: admin.role,
        phoneNumber: admin.phoneNumber,
      },
    };
  }

  static async verifyToken(token: string) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "tantrang_secret_key"
      ) as any;

      // Verify admin still exists and is active
      const admin = await prisma.admin.findUnique({
        where: {
          id: decoded.id,
          isActive: true,
        },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
        },
      });

      if (!admin) {
        throw new Error("Token không hợp lệ!");
      }

      return admin;
    } catch (error) {
      throw new Error("Token không hợp lệ!");
    }
  }

  static async changePassword(adminId: number, data: ChangePasswordData) {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new Error("Admin không tồn tại!");
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      data.currentPassword,
      admin.password
    );
    if (!isValidPassword) {
      throw new Error("Mật khẩu hiện tại không chính xác!");
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(data.newPassword, 12);

    // Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedNewPassword },
    });

    return { message: "Đổi mật khẩu thành công!" };
  }

  static hasPermission(userRole: string, requiredRoles: string[]): boolean {
    return requiredRoles.includes(userRole);
  }

  static isSuperAdmin(userRole: string): boolean {
    return userRole === "SUPER_ADMIN";
  }

  static canManageContent(userRole: string, contentType: string): boolean {
    if (userRole === "SUPER_ADMIN") return true;

    const permissions = {
      NEWS_ADMIN: ["news"],
      TNTT_ADMIN: ["tntt"],
      BIBLE_ADMIN: ["bible", "liturgical"],
    };

    return (
      permissions[userRole as keyof typeof permissions]?.includes(
        contentType
      ) || false
    );
  }
}
