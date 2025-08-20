import type { Request, Response, NextFunction } from "express";
import { AuthService } from "../services/auth.service";

interface AuthenticatedRequest extends Request {
  admin?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export const authorizeContentManagement = (contentType: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({ error: "Unauthorized!" });
    }

    const canManage = AuthService.canManageContent(req.admin.role, contentType);
    if (!canManage) {
      return res.status(403).json({
        error: `You are not authorized to manage ${contentType}!`,
      });
    }
    next();
  };
};

export const requireSuperAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.admin) {
    return res.status(401).json({ error: "Unauthorized!" });
  }

  if (!AuthService.isSuperAdmin(req.admin.role)) {
    return res
      .status(403)
      .json({ error: "You are not authorized to perform this action!" });
  }
  next();
};
