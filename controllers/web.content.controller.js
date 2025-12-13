import Website from "./../models/web.content.models.js";
import axios from "axios";
import * as cheerio from 'cheerio';

// Crawl website & extract content
export const addWebsite = async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ message: "Website URL is required" });

  try {
    // Add https:// if not present
    let formattedUrl = url;
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }

    // Check if website already exists
    const existingWebsite = await Website.findOne({ url: formattedUrl });
    if (existingWebsite) {
      return res.status(200).json({ 
        message: "Website already scraped. Here is the embed script.",
        script: `<script src="https://anvobot-ai-web-agent.vercel.app/widget.js?websiteId=${existingWebsite._id}"></script>`,
        websiteId: existingWebsite._id,
        alreadyExists: true
      });
    }

    const { data } = await axios.get(formattedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(data);
    let content = $("body").text().replace(/\s+/g, " ").trim();
    
    // If content is too short, try getting more elements
    if (content.length < 100) {
      content = $("html").text().replace(/\s+/g, " ").trim();
    }

    const newWebsite = await Website.create({ url: formattedUrl, content });

    const script = `<script src="https://anvobot-ai-web-agent.vercel.app/widget.js?websiteId=${newWebsite._id}"></script>`;
    
    res.status(200).json({ 
      message: "✅ Website scraped successfully! Embed the chatbot using the script.",
      script,
      websiteId: newWebsite._id,
      contentLength: content.length
    });
  } catch (error) {
    console.error("Error scraping website:", error.message);
    
    // Provide more specific error messages
    let errorMessage = "Error extracting website content. Please check the URL and try again.";
    
    if (error.code === 'ECONNREFUSED') {
      errorMessage = "Cannot connect to the website. Please check if the URL is correct and the website is online.";
    } else if (error.code === 'ENOTFOUND') {
      errorMessage = "Website not found. Please check the URL.";
    } else if (error.response?.status === 404) {
      errorMessage = "Website not found (404 error). Please check the URL.";
    } else if (error.response?.status === 403) {
      errorMessage = "Access to the website is forbidden. The website may block scraping.";
    }
    
    res.status(500).json({ 
      message: errorMessage,
      error: error.message
    });
  }
};
