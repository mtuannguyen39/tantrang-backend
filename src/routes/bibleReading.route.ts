import express from "express";
import {
  createReading,
  getReadings,
} from "../controllers/bibleReading.controller";

const router = express.Router();

router.get("/", getReadings);
router.get("/", createReading);

export default router;
