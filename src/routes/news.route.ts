import express from "express";
import { Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { supabase } from "../config/supabase";
import { v4 as uuidv4 } from "uuid";
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
router.post(
  "/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "Không có file nào được upload" });
        return;
      }

      const uniqueFileName = `${uuidv4()}.jpeg`;
      // const filename = `${Date.now()}.jpeg`;
      // const outputPath = path.join(__dirname, "../../uploads", filename);

      // Đảm bảo thư mục tồn tại
      // const uploadDir = path.join(__dirname, "../../uploads");
      // if (!fs.existsSync(uploadDir)) {
      //   fs.mkdirSync(uploadDir, { recursive: true });
      // }

      // Trả về URL chính xác
      // const filePath = `/uploads/${filename}`;
      // res.json({ url: filePath });

      // Nén và resize ảnh
      const resizedBuffer = await sharp(file.buffer)
        .resize(800) // resize width 800px, height auto
        .jpeg({ quality: 70 }) // nén ảnh
        .toBuffer();

      // Upload file lên Supabase Storage
      // Tạo một "Bucket" trong Supabase Storage của bạn, ví dụ: "thumbnails"
      const { data, error } = await supabase.storage
        .from("thumbnails") // Tên bucket của bạn (cần tạo trong Supabase Dashboard)
        .upload(uniqueFileName, resizedBuffer, {
          contentType: "image/jpeg",
          upsert: false, // Không ghi đè nếu file đã tồn tại
        });

      if (error) {
        console.error("🔥 Supabase upload failed:", error);
        res.status(500).json({
          error: "Upload ảnh lên Supabase thất bại",
          details: error.message,
        });
        return;
      }

      // Supabase trả về đường dẫn tới file công khai
      const publicURLResponse = supabase.storage
        .from("thumbnails")
        .getPublicUrl(uniqueFileName);

      // if (publicURLResponse.error) {
      //   console.error(
      //     "🔥 Supabase get public URL failed:",
      //     publicURLResponse.error
      //   );
      //   return res
      //     .status(500)
      //     .json({
      //       error: "Không thể lấy URL công khai của ảnh",
      //       details: publicURLResponse.error.message,
      //     });
      // }

      const publicUrl = publicURLResponse.data.publicUrl;

      // Trả về URL công khai
      // Frontend sẽ trực tiếp sử dụng URL này để hiển thị ảnh
      res.json({ url: publicUrl });
    } catch (err) {
      console.error("🔥 Sharp processing failed:", err);
      res.status(500).json({ error: "Image processing failed" });
    }
  }
);

// DELETE /api/news/delete-image
const deleteImageHandler = async (req: Request, res: Response) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    res.status(400).json({ error: "URL ảnh không được cung cấp" });
    return;
  }

  // Trích xuất tên file từ URL
  const filename = path.basename(imageUrl);

  const { error } = await supabase.storage
    .from("thumbnails")
    .remove([filename]);

  if (error) {
    console.error("🔥 Supabase delete failed:", error);
    res.status(500).json({
      error: "Không thể xóa ảnh",
      details: error.message,
    });
    return;
  }
  res.status(200).json({ message: ` Ảnh ${filename} đã được xóa ` });

  // Feature xóa trên local
  // const filePathToDelete = path.join(__dirname, "../../uploads", filename);

  // // Kiểm tra xem file có tồn tại và nằm trong thư mục 'uploads' không để tăng cao hệ thống bảo mật
  // if (!filePathToDelete.startsWith(path.join(__dirname, "../../uploads"))) {
  //   res
  //     .status(403)
  //     .json({ error: "Truy cập bị từ chối: Đường dẫn file không hợp lệ." });
  //   return;
  // }

  // fs.unlink(filePathToDelete, (err) => {
  //   if (err) {
  //     if (err.code === "ENOENT") {
  //       console.warn(
  //         `Attempted to delete non-existent file: ${filePathToDelete}`
  //       );
  //       res.status(404).json({ error: "File không tồn tại hoặc đã bị xóa." });
  //       return;
  //     }
  //     console.error(`Error deleting file: ${filePathToDelete}:`, err);
  //     res.status(500).json({ error: "Không thể xóa file." });
  //     return;
  //   }

  //   res
  //     .status(200)
  //     .json({ message: `File ${filename} đã được xóa thành công.` });
  // });
};

router.delete("/delete-image", deleteImageHandler);

router.get("/", getNews);
router.get("/:id", getNewsDetail);
router.post("/", createNews);
router.delete("/:id", deleteNews);
router.put("/:id", updateNews);

export default router;
