import { Request, Response } from "express";
import * as liturgicalYearService from "../services/liturgicalYear.service";
import prisma from "../prisma/client";

export const getYear = async (req: Request, res: Response) => {
  const years = await liturgicalYearService.getAllYear();
  res.json(years);
};

export const getYearDetail = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await liturgicalYearService.getYearById(id);
  result
    ? res.json(result)
    : res.status(404).json({ error: "Không tìm thấy năm phụng vụ!!!" });
};

export const createYear = async (req: Request, res: Response) => {
  try {
    const {
      name,
      code,
      year,
      isFeatured,
      imageUrl,
      description,
      title,
      categoryId,
    } = req.body;
    const created = await liturgicalYearService.createYear({
      name,
      code,
      year,
      categoryId,
      isFeatured,
      imageUrl,
      description,
      title,
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: "Không thể tạo năm phụng vụ" });
  }
};

export const updateYear = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    name,
    code,
    year,
    isFeatured,
    imageUrl,
    description,
    title,
    categoryId,
  } = req.body;

  try {
    // Liệu có cần thiết phải isFeatured không?
    if (isFeatured) {
      await prisma.liturgicalYear.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const updated = await prisma.liturgicalYear.update({
      where: { id: Number(id) },
      data: {
        name,
        code,
        year,
        isFeatured: isFeatured ?? false,
        imageUrl,
        description,
        title,
        categoryId: parseInt(categoryId),
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Lỗi khi cập nhật năm phụng vụ: ", error);
    res.status(500).json({ error: "Không thể cập nhật tin tức năm phụng vụ" });
  }
};

export const deleteYear = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await liturgicalYearService.deleteYear(id);
    res.json({ mesage: "Xóa thành công" });
  } catch {
    res.status(404).json({ error: "Không tìm thấy năm phụng vụ" });
  }
};
