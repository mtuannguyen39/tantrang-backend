import express from "express";
import {
  getNews,
  createNews,
  deleteNews,
  getNewsDetail,
  updateNews,
} from "../controllers/news.controller";

const router = express.Router();

router.get("/", getNews);
router.get("/:id", getNewsDetail);
router.post("/", createNews);
router.delete("/:id", deleteNews);
router.put("/:id", updateNews);

export default router;
