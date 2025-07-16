import { Request, Response } from "express";
import prisma from "../prisma/client";

export const getCategoryContent = async (req: Request, res: Response) => {
  const { slug, type } = req.params;

  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category)
    return res.status(404).json({ error: "Không tìm thấy danh mục!" });

  switch (type) {
    case "news":
      return res.json(
        await prisma.news.findMany({ where: { categoryId: category.id } })
      );
    case "tntt":
      return res.json(
        await prisma.tNTT.findMany({ where: { categoryId: category.id } })
      );
    case "bible-readings":
      return res.json(
        await prisma.bibleReading.findMany({
          where: { categoryId: category.id },
          include: { liturgicalYear: true },
        })
      );
    case "liturgical-years":
      return res.json(
        await prisma.liturgicalYear.findMany({
          where: { categoryId: category.id },
        })
      );

    default:
      return res.status(400).json({ error: "Loại nội dung không phù hợp" });
  }
};
