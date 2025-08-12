import { Request, Response } from "express";
import * as readingService from "../services/bibleReading.service";
import prisma from "../prisma/client";

export const getReadings = async (req: Request, res: Response) => {
  const data = await readingService.getAllReadings();
  res.json(data);
};

export const getReadingDetail = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await readingService.getReadingById(id);
  result
    ? res.json(result)
    : res.status(404).json({ error: "Không tìm thấy!" });
};

export const createReading = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      scripture,
      description,
      thumbnail,
      liturgicalYearId,
      categoryId,
    } = req.body;
    const created = await readingService.createReading({
      title,
      slug,
      scripture,
      description,
      thumbnail,
      liturgicalYearId,
      categoryId,
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: "Không thể tạo Kinh Thánh" });
  }
};

export const updateReading = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title,
    slug,
    scripture,
    description,
    thumbnail,
    liturgicalYearId,
    categoryId,
  } = req.body;

  try {
    const updated = await prisma.bibleReading.update({
      where: { id: Number(id) },
      data: {
        title,
        slug,
        scripture,
        description,
        thumbnail,
        liturgicalYearId: parseInt(liturgicalYearId),
        categoryId: parseInt(categoryId),
      },
    });
    res.json(updated);
  } catch (error) {
    console.error("Lỗi khi cập nhật Kinh Thánh:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật Kinh Thánh" });
  }
};

export const deleteReading = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await readingService.deleteReading(id);
    res.json({ message: "Xóa thành công!" });
  } catch {
    res.status(404).json({ error: "Không tìm thấy sách Kinh Thánh!" });
  }
};
