import express from "express";
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import {
  getNews,
  createNews,
  deleteNews,
  getNewsDetail,
  updateNews,
} from "../controllers/news.controller";

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

// Xóa hình ảnh khi bấm nút delete trên frontend
// router.delete("/delete-image", async (req, res) => {
//   try {
//     const { imageUrl } = req.body;

//     if (!imageUrl) {
//       res.status(400).json({ error: "Không có URL ảnh để xóa!" });
//       return;
//     }

//     // Lấy tên file từ URL (bỏ /uploads/ ở đầu)
//     const filename = imageUrl.replace("/uploads/", "");

//     // Tạo đường dẫn đầy đủ tới file
//     const filePath = path.join(__dirname, "../../uploads", filename);

//     //Kiểm tra file có tồn tại không
//     if (!fs.existsSync(filePath)) {
//       res.status(404).json({ error: "File ảnh không tồn tại!" });
//       return;
//     }

//     // Xóa file
//     fs.unlinkSync(filePath);

//     res.json({
//       success: true,
//       message: "Đã xóa ảnh thành công!",
//       deletedFile: filename,
//     });
//   } catch (err) {
//     console.error("🔥 Deleted image failed: ", err);
//     res.status(500).json({ error: "Xóa ảnh thất bại!!!" });
//   }
// });

// DELETE /api/news/delete-image
const deleteImageHandler = (req: Request, res: Response): void => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    res.status(400).json({ error: "URL ảnh không được cung cấp" });
    return;
  }

  // Trích xuất tên file từ URL
  const filename = path.basename(imageUrl);
  const filePathToDelete = path.join(__dirname, "../../uploads", filename);

  // Kiểm tra xem file có tồn tại và nằm trong thư mục 'uploads' không để tăng cao hệ thống bảo mật
  if (!filePathToDelete.startsWith(path.join(__dirname, "../../uploads"))) {
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

router.get("/", getNews);
router.get("/:id", getNewsDetail);
router.post("/", createNews);
router.delete("/:id", deleteNews);
router.put("/:id", updateNews);

export default router;
