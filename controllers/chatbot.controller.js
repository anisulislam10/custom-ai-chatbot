import axios from "axios";
import Website from "./../models/web.content.models.js";
import dotenv from "dotenv";

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Function to trim content to a safe token limit
const trimContent = (content, maxTokens = 5000) => {
    const words = content.split(" ");
    return words.slice(0, maxTokens).join(" ");
};

export const chatWithBot = async (req, res) => {
    const { websiteId, message } = req.body;

    if (!websiteId || !message) {
        return res.status(400).json({ message: "Website ID and message are required" });
    }

    try {
        // Fetch the scraped content from MongoDB
        const website = await Website.findById(websiteId);
        if (!website) {
            return res.status(404).json({ message: "Website not found" });
        }

        // Trim content to avoid exceeding the token limit
        const trimmedContent = trimContent(website.content, 1000);

        // Send the content + user message to Groq
        const response = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                model: "llama-3.3-70b-versatile",
                messages: [
                    { role: "system", content: `You are an AI assistant trained based on the following website content:\n\n${trimmedContent}` },
                    { role: "user", content: message }
                ],
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${GROQ_API_KEY}`,
                }
            }
        );

        res.json({ response: response.data.choices[0].message.content });
    } catch (error) {
        console.error("Chatbot Error:", error.response?.data || error.message);
        res.status(500).json({ message: "Error processing chatbot request" });
    }
};
