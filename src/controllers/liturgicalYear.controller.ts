import { Request, Response } from "express";
import * as liturgicalYearService from "../services/liturgicalYear.service";

export const getYear = async (req: Request, res: Response) => {
  const years = await liturgicalYearService.getAllYear();
  res.json(years);
};

export const createYear = async (req: Request, res: Response) => {
  try {
    const { name, code, year, categoryId } = req.body;
    const created = await liturgicalYearService.createYear({
      name,
      code,
      year,
      categoryId,
    });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: "Không thể tạo năm phụng vụ" });
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
