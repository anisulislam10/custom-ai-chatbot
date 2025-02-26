import axios from "axios";
import Website from "./../models/web.content.models.js";
import dotenv from "dotenv";
import sendEmail from "../utils/email.utils.js"; // Import email function

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const chatSessions = {}; // Store user inputs temporarily

// Function to trim content to a safe token limit
const trimContent = (content, maxTokens = 5000) => {
    const words = content.split(" ");
    return words.slice(0, maxTokens).join(" ");
};

export const chatWithBot = async (req, res) => {
    const { websiteId, message, userId } = req.body;

    if (!websiteId || !message || !userId) {
        return res.status(400).json({ message: "Website ID, message, and user ID are required" });
    }

    // Check if user is in the booking process
    if (!chatSessions[userId]) {
        chatSessions[userId] = { stage: 0, name: "", email: "", userMessage: "" };
    }

    const lowerMessage = message.toLowerCase();

    // Handle booking/consultation requests
    if (chatSessions[userId].stage === 0) {
        if (/(book|consult|schedule|appointment)/.test(lowerMessage)) {
            chatSessions[userId].stage = 1;
            return res.json({ response: "Sure! Please provide your name." });
        }
    } else if (chatSessions[userId].stage === 1) {
        chatSessions[userId].name = message.trim();
        chatSessions[userId].stage = 2;
        return res.json({ response: "Got it! Now, please provide your email address." });
    } else if (chatSessions[userId].stage === 2) {
        if (!/^\S+@\S+\.\S+$/.test(message.trim())) {
            return res.json({ response: "Invalid email format. Please enter a valid email address." });
        }
        chatSessions[userId].email = message.trim();
        chatSessions[userId].stage = 3;
        return res.json({ response: "Great! Now, please enter your message or the details of your request." });
    } else if (chatSessions[userId].stage === 3) {
        chatSessions[userId].userMessage = message.trim();

        try {
            // Send email to Anis
            await sendEmail(
                "sales@sharplogician.com",
                "New Consultation Request",
                `Name: ${chatSessions[userId].name}\nEmail: ${chatSessions[userId].email}\nMessage: ${chatSessions[userId].userMessage}`,
                `<p><strong>Name:</strong> ${chatSessions[userId].name}</p>
                 <p><strong>Email:</strong> ${chatSessions[userId].email}</p>
                 <p><strong>Message:</strong> ${chatSessions[userId].userMessage}</p>`
            );

            // Reset session
            delete chatSessions[userId];

            return res.json({ response: "Thank you! Your request has been sent. We will get back to you soon." });
        } catch (emailError) {
            console.error("Email Sending Error:", emailError.message);
            return res.json({ response: "There was an issue sending your request. Please try again later." });
        }
    }

    // If the user is in a booking flow, don't proceed to general queries
    if (chatSessions[userId].stage > 0) {
        return;
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
