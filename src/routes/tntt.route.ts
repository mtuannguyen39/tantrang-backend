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
import { supabase } from "../config/supabase";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Dùng memoryStorage vì cần buffer ảnh cho sharp
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận các loại file ảnh phổ biến
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
});

// POST /api/tntt/uploadTntt
router.post(
  "/upload",
  (req, res, next) => {
    upload.single("file")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        return res
          .status(400)
          .json({ error: `Upload thất bại: ${err.message}` });
      } else if (err) {
        // Lỗi khác (ví dụ: từ fileFilter)
        return res
          .status(400)
          .json({ error: `Upload thất bại: ${err.message}` });
      }
      next();
    });
  },
  async (req, res): Promise<void> => {
    try {
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: "Không có file nào được upload" });
        return;
      }

      //Log File nhận được
      console.log("Kích thước File nhận được:", file.size, "bytes");
      console.log("Loại MIME của File:", file.mimetype);

      // Tạo tên file duy nhất với phần mở rộng .jpeg
      const uniqueFileName = `${uuidv4()}.jpeg`;

      // Nén và resize ảnh
      // Kiểm tra xem file.buffer có dữ liệu không trước khi truyền cho Sharp
      if (!file.buffer || file.buffer.length === 0) {
        res.status(400).json({ error: "Dữ liệu ảnh không hợp lệ hoặc trống." });
        return;
      }

      const resizedBuffer = await sharp(file.buffer)
        .resize(800) // resize width 800px, height auto
        .jpeg({ quality: 70 }) // nén ảnh
        .toBuffer();

      // Upload file lên Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("thumbnailstntt") // Tên bucket của bạn
        .upload(uniqueFileName, resizedBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });
      if (uploadError) {
        console.error("🔥 Supabase upload failed:", uploadError);
        res.status(500).json({
          error: "Upload ảnh lên Supabase thất bại",
          details: uploadError.message,
        });
        return;
      }
      // Lấy URL công khai. getPublicUrl không trả về lỗi.
      const { data: publicUrlData } = supabase.storage
        .from("thumbnailstntt")
        .getPublicUrl(uniqueFileName);

      const publicUrl = publicUrlData.publicUrl;

      // Trả về URL công khai
      res.json({ url: publicUrl });
    } catch (err) {
      // Bắt lỗi tổng quát từ Sharp hoặc các thao tác khác
      console.error("🔥 Lỗi xử lý hoặc upload ảnh:", err);
      res.status(500).json({
        error: "Lỗi xử lý hoặc upload ảnh lên server.",
        details: (err as Error).message,
      });
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

  try {
    // Trích xuất tên bucket và tên file từ URL Supabase
    const urlParts = imageUrl.split("/");
    const publicIndex = urlParts.indexOf("public");

    // Kiểm tra định dạng URL cơ bản
    if (publicIndex === -1 || publicIndex + 1 >= urlParts.length) {
      return res.status(400).json({
        error: "Định dạng URL ảnh không hợp lệ cho Supabase Storage.",
      });
    }

    const bucketName = urlParts[publicIndex + 1]; // Ví dụ: "thumbnailstntt"
    const fileNameInBucket = urlParts.slice(publicIndex + 2).join("/"); // Phần còn lại là tên file, bao gồm cả sub-folder nếu có

    if (!bucketName || !fileNameInBucket) {
      return res.status(400).json({
        error: "Không thể trích xuất tên bucket hoặc tên file từ URL.",
      });
    }

    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([fileNameInBucket]);

    if (deleteError) {
      console.error("🔥 Supabase delete failed:", deleteError);
      // Xử lý lỗi cụ thể hơn nếu cần (ví dụ: file không tồn tại)
      if (deleteError.message.includes("not found")) {
        // Kiểm tra thông báo lỗi của Supabase
        return res.status(404).json({
          error: `File ảnh không tồn tại trên Supabase Storage: ${fileNameInBucket}`,
        });
      }
      return res.status(500).json({
        error: "Không thể xóa ảnh từ Supabase Storage.",
        details: deleteError.message,
      });
    }

    res.status(200).json({
      message: `Ảnh ${fileNameInBucket} đã được xóa thành công từ Supabase Storage.`,
    });
  } catch (err) {
    console.error("🔥 Lỗi trong quá trình xóa ảnh từ Supabase Storage:", err);
    res.status(500).json({
      error: "Lỗi nội bộ khi xóa ảnh từ Supabase Storage.",
      details: (err as Error).message,
    });
  }
};

router.delete("/delete-image", (req, res, next) => {
  deleteImageHandler(req, res).catch(next);
});

router.get("/", getTntt);
router.get("/:id", getTnttDetail);
router.post("/", createTntt);
router.put("/:id", updateTntt);
router.delete("/:id", deleteTntt);

export default router;
