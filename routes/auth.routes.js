import express from "express";
import { registerUser, loginUser, verifyUser, forgotPassword, resetPassword } from "../controllers/auth.controller.js";

const router = express.Router();

// Routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyUser); 
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
