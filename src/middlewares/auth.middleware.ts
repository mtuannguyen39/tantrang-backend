import type { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../prisma/client";
import type { AuthenticatedRequest } from "../types/admin.types";

export const authenticateAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "Token không được cung cấp!" });
      return;
    }

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
      res.status(401).json({ error: "Token không hợp lệ!" });
      return;
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token không hợp lệ!" });
  }
};

export const authorizeRoles = (...roles: string[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.admin) {
      res.status(401).json({ error: "Chưa xác thực!" });
      return;
    }

    if (!roles.includes(req.admin.role)) {
      res.status(403).json({
        error: "Không có quyền truy cập!",
      });
      return;
    }

    next();
  };
};
