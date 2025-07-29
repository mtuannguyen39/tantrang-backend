import express from "express";
import { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { supabase } from "../config/supabase";
import { v4 as uuidv4 } from "uuid";
import {
  createYear,
  deleteYear,
  getYear,
  getYearDetail,
  updateYear,
} from "../controllers/liturgicalYear.controller";

const router = express.Router();

// Dùng memoryStorage để nhận buffer của file
const storage = multer.memoryStorage();
//Cấu hình Multer với giới hạn kích thước file
// Giới hạn 25MB cho file ảnh
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // giới hạn 25mb
    files: 1, // Chỉ cho phép 1 file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else cb(null, false);
  },
});

// POST /api/liturgicalYear/upload
router.post(
  "/upload",
  // Sử dụng middleware xử lý lỗi tùy chỉnh cho Multer
  (req, res, next) => {
    upload.single("file")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        // Lỗi từ Multer (ví dụ: FILE_TOO_LARGE)
        return res.status(400).json({ error: `Upload thất bại` });
      } else if (err) {
        // Lỗi khác (ví dụ: từ fileFilter)
        return res
          .status(400)
          .json({ error: `Upload thất bại: ${err.message}` });
      }
      next(); // Chuyển sang middleware tiếp theo nếu không có lỗi
    });
  },
  async (req, res): Promise<void> => {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({ error: "Không có file nào được upload." });
        return;
      }
      // Log thông tin về file nhận được
      console.log("Kích thước file nhận được:", file.size, "bytes");
      console.log("Loại MIME của file:", file.mimetype);

      // Tạo tên file duy nhất với phần mở rộng .jpeg
      const uniqueFileName = `${uuidv4()}.jpeg`;

      // Nén và resize ảnh
      // Kiểm tra xem file.buffer có dữ liệu không trước khi truyền file cho Sharp
      if (!file.buffer || file.buffer.length === 0) {
        res.status(400).json({ error: "Dữ liệu ảnh không hợp lệ hoặc trống." });
        return;
      }

      const resizedBuffer = await sharp(file.buffer)
        .resize(800)
        .jpeg({ quality: 70 })
        .toBuffer();

      // Upload file lên Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("year.image") //Tên bucket
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

      //Lấy URL public. getPublicUrl không trả về lỗi
      const { data: publicUrlData } = supabase.storage
        .from("year.image")
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

// DELETE /api/liturgicalYear/delete-image
const deleteImageHandler = async (req: Request, res: Response) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "URL ảnh không được cung cấp." });
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

    const bucketName = urlParts[publicIndex + 1];
    const fileNameInBucket = urlParts.slice(publicIndex + 2).join("/"); // Phẩn còn lại là tên file, bao gồm cả sub-folder nếu có

    if (!bucketName || !fileNameInBucket) {
      return res.status(400).json({
        error: "Không thể trích xuất tên bucket hoặc tên file từ URL",
      });
    }

    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([fileNameInBucket]);

    if (deleteError) {
      console.error("🔥 Supabase delete failed:", deleteError);

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
      res.status(200).json({
        message: `Ảnh ${fileNameInBucket} đã được xóa thành công từ Supabase Storage.`,
      });
    }
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

router.get("/", getYear);
router.post("/", createYear);
router.post("/:id", updateYear);
router.get("/:id", getYearDetail);
router.delete("/:id", deleteYear);

export default router;
