import express from "express";
import { addWebsite } from "../controllers/web.content.controller.js";

const router = express.Router();

router.post("/add-website", addWebsite);

export default router;
