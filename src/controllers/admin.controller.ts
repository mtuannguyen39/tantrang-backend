import { Request, Response } from "express";
import prisma from "../prisma/client";

export const getAdminStats = async (_req: Request, res: Response) => {
  try {
    const [newsCount, tnttCount, bibleCount] = await Promise.all([
      prisma.news.count(),
      prisma.tNTT.count(),
      prisma.bibleReading.count(),
    ]);

    return res.json({
      newsCount,
      tnttCount,
      bibleCount,
    });
  } catch (error) {
    return res.status(500).json({ error: "Lỗi Server!" });
  }
};
