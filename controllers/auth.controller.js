import bcrypt from "bcryptjs";
import { body, validationResult } from "express-validator";
import User from "../models/user.models.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import sendEmail from "../utils/email.utils.js";
import { generateToken } from "../utils/jwt.utills.js";

// Validation Middleware
export const validateUser = [
  body("name").optional().trim().isLength({ min: 3 }).withMessage("Name must be at least 3 characters long"),
  body("email").trim().isEmail().withMessage("Invalid email format"),
  body("password").trim().isLength({ min: 4 }).withMessage("Password must be at least 4 characters long"),
];

// 📌 Register User & Send Email Verification Link
// 📌 Register User & Send Email Verification Link
export const registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });

    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate a Verification Token (Valid for 1 hour)
    const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const newUser = await User.create({ name, email, password: hashedPassword, isVerified: false });

    // Construct Verification Link
    const verificationLink = `https://custom-ai-chatbot-admin.vercel.app/api/auth/verify/${verificationToken}`;

    // HTML Email Content
    const htmlContent = `
      <h2>Welcome to Anvobot!</h2>
      <p>Click the button below to verify your account:</p>
      <a href="${verificationLink}" style="
        display: inline-block;
        padding: 10px 20px;
        margin-top: 10px;
        color: white;
        background-color: #007bff;
        text-decoration: none;
        border-radius: 5px;
      ">Verify Your Account</a>
      <p>If the button does not work, you can also click the link below:</p>
      <p><a href="${verificationLink}">${verificationLink}</a></p>
    `;

    // Send Email
    await sendEmail(email, "Verify Your Account", `Click here to verify your account: ${verificationLink}`, htmlContent);

    res.status(201).json({ message: "Verification link sent to email. Please verify your account." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Verify User (When They Click on Email Link)
export const verifyUser = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ email: decoded.email });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    // Update & Save User
    user.isVerified = true;
    await user.save();

    console.log(`User ${user.email} verified successfully.`);

    res.send("<h2>Your account has been verified successfully! You can now log in.</h2>");
  } catch (error) {
    console.error("❌ Verification Error:", error);
    res.status(500).json({ message: "Invalid or expired token" });
  }
};

  
  

// 📌 Login User
export const loginUser = async (req, res) => {

    console.log("token",generateToken(User._id))
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    if (!user.isVerified) return res.status(400).json({ message: "Account not verified. Please check your email." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Forgot Password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const message = `Click the following link to reset your password: ${resetUrl}`;

    await sendEmail(user.email, "Password Reset Request", message);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📌 Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getUser = async (req, res) => {
  try {
    // Extract user ID from JWT token (preferred) or request params
    const userId = req.user?._id || req.params.id;

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Fetch user from the database (excluding password)
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User fetched successfully",
      user: {
        id: user._id.toString(), // Convert ObjectId to string
        name: user.name,
        email: user.email,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
