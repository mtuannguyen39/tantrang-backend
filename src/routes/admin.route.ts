import express, { Request, Response } from "express";
import { getAdminStats } from "../controllers/admin.controller";

const router = express.Router();

router.get("/stats", getAdminStats as (req: Request, res: Response) => any);

export default router;
