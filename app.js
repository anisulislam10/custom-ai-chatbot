import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/MongoDB.js";
import authRoutes from './routes/auth.routes.js';
import webcontentRoutes from './routes/web.content.routes.js';
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

// Add a health check endpoint (important for Vercel)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/web', webcontentRoutes);
app.use('/api/chatbot', chatbotRoutes);

// Connect to DB (without blocking)
connectDB().catch(err => {
  console.error('MongoDB connection error:', err);
});

// CRITICAL: Remove app.listen() for Vercel deployment
// Vercel will handle the server, so we only export the app

export default app;

// Optional: Keep app.listen() only for local development
if (process.env.NODE_ENV === 'development' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Local server running on port ${PORT}`));
}
