import express from "express";
import { Request, Response } from "express";
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

// DELETE /api/news/delete-image
const deleteImageHandler = (req: Request, res: Response): void => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    res.status(400).json({ error: "URL ảnh không được cung cấp" });
    return;
  }

  // Trích xuất tên file từ URL
  const filename = path.basename(imageUrl);
  const filePathToDelete = path.join(__dirname, "../../uploadTntt", filename);

  // Kiểm tra xem file có tồn tại và nằm trong thư mục 'uploads' không để tăng cao hệ thống bảo mật
  if (!filePathToDelete.startsWith(path.join(__dirname, "../../uploadTntt"))) {
    res
      .status(403)
      .json({ error: "Truy cập bị từ chối: Đường dẫn file không hợp lệ." });
    return;
  }

  fs.unlink(filePathToDelete, (err) => {
    if (err) {
      if (err.code === "ENOENT") {
        console.warn(
          `Attempted to delete non-existent file: ${filePathToDelete}`
        );
        res.status(404).json({ error: "File không tồn tại hoặc đã bị xóa." });
        return;
      }
      console.error(`Error deleting file: ${filePathToDelete}:`, err);
      res.status(500).json({ error: "Không thể xóa file." });
      return;
    }

    res
      .status(200)
      .json({ message: `File ${filename} đã được xóa thành công.` });
  });
};

router.delete("/delete-image", deleteImageHandler);

router.get("/", getTntt);
router.get("/:id", getTnttDetail);
router.post("/", createTntt);
router.put("/:id", updateTntt);
router.delete("/:id", deleteTntt);

export default router;
