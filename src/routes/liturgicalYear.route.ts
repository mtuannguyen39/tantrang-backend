import express from "express";
import {
  createYear,
  deleteYear,
  getYear,
} from "../controllers/liturgicalYear.controller";

const router = express.Router();

router.get("/", getYear);
router.post("/", createYear);
router.delete("/", deleteYear);

export default router;
