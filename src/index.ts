import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

import { errorHandler } from "./middlewares/errorHandler";

import newsRoutes from "./routes/news.route";
import readingRoutes from "./routes/bibleReading.route";
import categoryRoutes from "./routes/category.route";
import tnttRoutes from "./routes/tntt.route";
import yearRoutes from "./routes/liturgicalYear.route";
import categoryContentRoutes from "./routes/categoryContent.route";
import adminRoutes from "./routes/admin.routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(errorHandler);

// Routes
app.use("/api/reading", readingRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/tntt", tnttRoutes);
app.use("/api/year", yearRoutes);
app.use("/api/category", categoryContentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/news", newsRoutes);

// Static file để truy cập ảnh của NEWS
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Static file để truy cập ảnh của TNTT
app.use("/uploadTntt", express.static(path.join(__dirname, "../uploadTntt")));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
