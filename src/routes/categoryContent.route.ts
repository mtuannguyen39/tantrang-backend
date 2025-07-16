import express from "express";
import { getCategoryContent } from "../controllers/categoryContent.controller";
import { Request, Response } from "express";

const router = express.Router();

router.get(
  "/:slug/:type",
  getCategoryContent as (req: Request, res: Response) => any
); // Cách ép kiểu khác an toàn hơn trong trường hợp refactor ko chuẩn là dùng as RequestHandler sẽ fix sau

export default router;
