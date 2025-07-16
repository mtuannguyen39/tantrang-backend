import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";

const router = express.Router();

// Dùng memoryStorage vì cần buffer ảnh cho sharp
const storage = multer.memoryStorage();
const upload = multer({ storage });

// POST /api/news/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Không có file nào được upload" });
      return;
    }

    const filename = `${Date.now()}.jpeg`;
    const outputPath = path.join(__dirname, "../../uploads", filename);

    // Đảm bảo thư mục tồn tại
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Nén và resize ảnh
    await sharp(file.buffer)
      .resize(800) // resize width 800px, height auto
      .jpeg({ quality: 70 }) // nén ảnh
      .toFile(outputPath);

    // Trả về URL chính xác
    const filePath = `/uploads/${filename}`;
    res.json({ url: filePath });
  } catch (err) {
    console.error("🔥 Sharp processing failed:", err);
    res.status(500).json({ error: "Image processing failed" });
  }
});

export default router;
