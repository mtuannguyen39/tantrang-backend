import { Request, Response, NextFunction } from "express";

export function adminMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (
    req.path.startsWith("/admin") &&
    !req.path.startsWith("/admin/auth/login")
  ) {
    // cho phép đi tiếp
    return next();
  }

  return next();
}
