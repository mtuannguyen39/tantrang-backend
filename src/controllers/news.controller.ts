import { Request, Response } from "express";
import * as newsService from "../services/news.service";
import prisma from "../prisma/client";

export const getNews = async (req: Request, res: Response) => {
  const news = await newsService.getAllNews();
  res.json(news);
};

export const getNewsDetail = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await newsService.getNewsById(id);
  result ? res.json(result) : res.status(404).json({ error: "Không tìm thấy" });
};

export const createNews = async (req: Request, res: Response) => {
  const {
    title,
    slug,
    content,
    thumbnail,
    categoryId,
    isFeatured,
    liturgicalYearId,
  } = req.body; // Thêm phần liturgicalYearId vào để tạo có thể chọn Năm phụng vụ.
  try {
    if (isFeatured) {
      await prisma.news.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }
    const created = await prisma.news.create({
      data: {
        title,
        slug,
        content,
        thumbnail,
        categoryId: parseInt(categoryId),
        isFeatured: isFeatured ?? false,
        liturgicalYearId: parseInt(liturgicalYearId),
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: "Không thể tạo tin tức" });
  }
};

// Bug: khi xóa bài thì sẽ xóa luôn hiển thị admin
export const updateNews = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title,
    slug,
    content,
    thumbnail,
    categoryId,
    isFeatured,
    liturgicalYearId,
  } = req.body;

  try {
    // Nếu đánh dấu nổi bật, reset các bài khác
    if (isFeatured) {
      await prisma.news.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const updated = await prisma.news.update({
      where: { id: Number(id) },
      data: {
        title,
        slug,
        content,
        thumbnail,
        categoryId: parseInt(categoryId),
        isFeatured: isFeatured ?? false,
        liturgicalYearId: parseInt(liturgicalYearId),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Lỗi khi cập nhật tin tức:", error);
    res.status(500).json({ error: "Không thể cập nhật tin tức" });
  }
};

export const deleteNews = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await newsService.deleteNews(id);
  res.json({ message: "Xóa thánh công" });
};
