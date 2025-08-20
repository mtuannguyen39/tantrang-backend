import type { Request } from "express";

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: number;
    username: string;
    email: string;
    role: string;
  };
}

export enum AdminRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  NEWS_ADMIN = "NEWS_ADMIN",
  TNTT_ADMIN = "TNTT_ADMIN",
  BIBLE_ADMIN = "BIBLE_ADMIN",
}
