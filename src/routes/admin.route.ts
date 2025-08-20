import express from "express";
import { getAdminStats } from "../controllers/admin.controller";
import adminAuthRoutes from "./admin.auth.routes";
import adminManagementRoutes from "./admin.management.routes";

const router = express.Router();

// Stats endpoint (existing)
router.get("/stats", getAdminStats);

// Auth routes
router.use("/auth", adminAuthRoutes);

// Management routes
router.use("/management", adminManagementRoutes);

export default router;
