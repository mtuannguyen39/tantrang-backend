import express from "express";
import {
  getCategories,
  createCategory,
  deleteCategory,
} from "../controllers/category.controller";

const router = express.Router();

router.get("/", getCategories);
router.post("/", createCategory);
router.delete("/", deleteCategory);

export default router;
