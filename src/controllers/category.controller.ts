import { Request, Response } from "express";
import * as categoryService from "../services/category.service";

export const getCategories = async (req: Request, res: Response) => {
  const categories = await categoryService.getAllCategories();
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, slug } = req.body;
    const created = await categoryService.createCategory({ name, slug });
    res.status(201).json(created);
  } catch (error) {
    res.status(400).json({ error: "Tạo danh mục thất bại" });
  }
};

export const deleteCategory = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    await categoryService.deleteCategory(id);
    res.json({ message: "Xóa thành công" });
  } catch {
    res.status(404).json({ error: "Không tìm thấy category" });
  }
};
