import express from "express";
import {
  createTntt,
  deleteTntt,
  getTntt,
  getTnttDetail,
  updateTntt,
} from "../controllers/tntt.controller";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const router = express.Router();

// Dùng memoryStorage vì cần buffer ảnh cho sharp
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/tntt/uploadTntt
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Không có file nào được upload" });
      return;
    }

    const filename = `${Date.now()}.jpeg`;
    const outputPath = path.join(__dirname, "../../uploadTntt", filename);

    // Đảm bảo thư mục tồn tại
    const uploadDir = path.join(__dirname, "../../uploadTntt");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Nén và resize ảnh
    await sharp(file.buffer)
      .resize(800) // Resize width 800px, height auto
      .jpeg({ quality: 70 }) // Nén ảnh
      .toFile(outputPath);

    // Trả về URL chính xác
    const filePath = `/uploadTntt/${filename}`;
    res.json({ url: filePath });
  } catch (err) {
    console.error("🔥 Sharp processing failed:", err);
    res.status(500).json({ error: "Image processing failed" });
  }
});

router.get("/", getTntt);
router.get("/:id", getTnttDetail);
router.post("/", createTntt);
router.put("/:id", updateTntt);
router.delete("/:id", deleteTntt);

export default router;
