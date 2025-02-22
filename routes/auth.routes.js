import express from "express";
import { registerUser, loginUser, verifyUser, forgotPassword, resetPassword,getUser } from "../controllers/auth.controller.js";
import { protect  } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Routes
router.post("/register", registerUser);
router.get("/profile", protect, getUser);
router.post("/login", loginUser);
router.get("/verify/:token", verifyUser); 
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);


export default router;
