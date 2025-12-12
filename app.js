import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/MongoDB.js";
import authRoutes from './routes/auth.routes.js'
import webcontentRoutes from './routes/web.content.routes.js'
import chatbotRoutes from './routes/chatbot.routes.js';

dotenv.config();

const app = express();

// Configure CORS
const corsOptions = {
  origin: 'https://anvobot-ai-web-agent.vercel.app',
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.static("public")); // Serve static files like widget.js

// Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/web', webcontentRoutes);
app.use('/api/chatbot', chatbotRoutes);

connectDB();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;