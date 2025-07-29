import { Request, Response } from "express";
import * as readingService from "../services/bibleReading.service";

export const getReadings = async (req: Request, res: Response) => {
  const data = await readingService.getAllReadings();
  res.json(data);
};

export const createReading = async (req: Request, res: Response) => {
  try {
    const {
      title,
      slug,
      scripture,
      content,
      date,
      liturgicalYearId,
      categoryId,
    } = req.body;
    const created = await readingService.createReading({
      title,
      slug,
      scripture,
      content,
      date: new Date(date),
      liturgicalYearId,
      categoryId,
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: "Không thể tạo Kinh Thánh" });
  }
};

export const deleteBible = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await readingService.deleteReading(id);
    res.json({ message: "Xóa thành công!" });
  } catch {
    res.status(404).json({ error: "Không tìm thấy sách Kinh Thánh!" });
  }
};
