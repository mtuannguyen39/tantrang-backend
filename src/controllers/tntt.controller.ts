import { Request, Response } from "express";
import * as tnttService from "../services/tntt.service";
import prisma from "../prisma/client";

export const getTntt = async (req: Request, res: Response) => {
  const tntt = await tnttService.getAllTNTT();
  res.json(tntt);
};

export const getTnttDetail = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const result = await tnttService.getTnttById(id);
  result ? res.json(result) : res.status(404).json({ error: "Không tìm thấy" });
};

export const createTntt = async (req: Request, res: Response) => {
  const { title, slug, description, thumbnail, categoryId, isFeatured } =
    req.body;
  try {
    if (isFeatured) {
      await prisma.tNTT.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }
    const created = await prisma.tNTT.create({
      data: {
        title,
        slug,
        description,
        thumbnail,
        categoryId: parseInt(categoryId),
        isFeatured: isFeatured ?? false,
      },
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: "Không thể tạo tin cho TNTT" });
  }
};

export const deleteTntt = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  await tnttService.deleteTntt(id);
  res.json({ message: "Xóa thành công" });
};

export const updateTntt = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, slug, description, thumbnail, categoryId, isFeatured } =
    req.body;

  try {
    //Nếu đánh dấu nổi bật, reset các bài khác
    if (isFeatured) {
      await prisma.tNTT.updateMany({
        where: { isFeatured: true },
        data: { isFeatured: false },
      });
    }

    const updated = await prisma.tNTT.update({
      where: { id: Number(id) },
      data: {
        title,
        slug,
        description,
        thumbnail,
        categoryId: parseInt(categoryId),
        isFeatured: isFeatured ?? false,
      },
    });
    res.json(updated);
  } catch (error) {
    console.error("Lỗi khi cập nhật tin tức của TNTT:", error);
    res.status(400).json({ error: "Không thể cập nhật tin tức của TNTT" });
  }
};
