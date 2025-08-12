import express from "express";
import { Request, Response } from "express";
import multer from "multer";
import sharp from "sharp";
import { supabase } from "../config/supabase";
import { v4 as uuidv4 } from "uuid";
import {
  createReading,
  deleteReading,
  getReadingDetail,
  getReadings,
  updateReading,
} from "../controllers/bibleReading.controller";

const router = express.Router();

// Dùng memoryStorage để nhận buffer của file, rất tốt cho Sharp
const storage = multer.memoryStorage();
// Cấu hình Multer với giới hạn kích thước file
// Ví dụ: giới hạn 25mb. Điều này giúp ngăn chặn các file quá lớn gây lỗi cho Sharp
const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024, //25mb
    files: 1, // Chỉ cho phép 1 files
  },
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận các loại file ảnh phổ biến
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else cb(null, false);
  },
});

// POST /api/bible-reading/upload
router.post(
  "/uploadBible",
  // Sử dụng một middleware xử lý lỗi tùy chỉnh cho Multer
  (req, res, next) => {
    upload.single("file")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        // Lỗi từ Multer (ví dụ: FILE_TOO_LARGE)
        return res
          .status(400)
          .json({ error: `Upload thất bại: ${err.message}` });
      } else if (err) {
        // Lỗi khác (ví dụ: từ FileFilter)
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

      // Log file nhận được
      console.log("Kích thước file nhận được:", file.size, "bytes");
      console.log("Loại MIME của file:", file.mimetype);

      // Tạo tên tile duy nhất với phần mở rộng .jpeg
      const uniqueFileName = `${uuidv4()}.jpeg`;

      // Nén và resize ảnh
      // Kiểm tra xem file.bufer có dữ liệu không trước khi  truyền cho Sharp
      if (!file.buffer || file.buffer.length === 0) {
        res.status(400).json({ error: "Dữ liệu ảnh không hợp lệ hoặc trống." });
        return;
      }
      const resizedBuffer = await sharp(file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();

      // Uoload file lên Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("bibleupload")
        .upload(uniqueFileName, resizedBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        console.log("🔥 Supabase upload failed:", uploadError);
        res.status(500).json({
          error: "Upload ảnh lên Supabase thất bại",
          details: uploadError.message,
        });
        return;
      }

      // Lấy URL công khai. getPublicUrl không trả về lỗi
      const { data: publicUrlData } = supabase.storage
        .from("bibleupload")
        .getPublicUrl(uniqueFileName);

      const publicUrl = publicUrlData.publicUrl;

      res.json({ url: publicUrl });
    } catch (err) {
      // bắt lỗi tổng quát từ Sharp hoặc các thao tác khác
      console.error("🔥 Lỗi xử lý hoặc upload ảnh:", err);
      res.status(500).json({
        error: "Lỗi xử lý hoặc upload ảnh",
        details: err instanceof Error ? err.message : "Lỗi không xác định",
      });
    }
  }
);

const deleteImageHandler = async (req: Request, res: Response) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: "URL ảnh không được cung cấp." });
  }

  try {
    const urlParts = imageUrl.split("/");
    const publicIndex = urlParts.indexOf("public");

    if (publicIndex === -1 || publicIndex + 1 >= urlParts.length) {
      return res.status(400).json({
        error: "Định dạng URL ảnh không hợp lệ cho Supabase Storage.",
      });
    }

    const bucketName = urlParts[publicIndex + 1]; // Ví dụ: "bibleupload"
    const fileNameInBucket = urlParts.slice(publicIndex + 2).join("/"); // Phần còn lại là tên file, bao gồm cả sub-folder nếu có

    if (!bucketName || !fileNameInBucket) {
      return res.status(400).json({
        error: "Không thể trích xuất tên bucket hoặc teenfile từ URL.",
      });
    }

    const { error: deleteError } = await supabase.storage
      .from(bucketName)
      .remove([fileNameInBucket]);

    if (deleteError) {
      console.error("🔥 Supabase delete failed:", deleteError);
      if (deleteError.message.includes("not found")) {
        return res.status(404).json({
          error: `File ảnh không tồn tại trên Supabase Storage: ${fileNameInBucket}`,
        });
      }
      return res.status(500).json({
        error: "Lỗi khi xóa file ảnh trên Supabase Storage",
        details: deleteError.message,
      });
    }
    res.status(200).json({
      message: ` Ảnh ${fileNameInBucket} đã được xóa thành công từ Supabase Storage.`,
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

router.get("/", getReadings);
router.get("/:id", getReadingDetail);
router.post("/", createReading);
router.delete("/:id", deleteReading);
router.put("/:id", updateReading);

export default router;
