import Website from "./../models/web.content.models.js";
import axios from "axios";
import * as cheerio from 'cheerio';

// Crawl website & extract content
// Crawl website & extract content
export const addWebsite = async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ message: "Website URL is required" });

  try {
    // Check if website already exists
    const existingWebsite = await Website.findOne({ url });
    if (existingWebsite) {
      return res.status(400).json({ 
        message: "Website already scraped. Here is the embed script.",
        script: `<script src="https://anvobot-ai-web-agent.vercel.app/widget.js?websiteId=${existingWebsite._id}"></script>`
      });
    }

    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let content = $("body").text().replace(/\s+/g, " ").trim();

    const newWebsite = await Website.create({ url, content });

    const script = `<script src="https://anvobot-ai-web-agent.vercel.app/widget.js?websiteId=${newWebsite._id}"></script>`;
    
    res.json({ 
      message: "Website scraped successfully! Embed the chatbot using the script.",
      script 
    });
  } catch (error) {
    console.error("Error scraping website:", error.message);
    res.status(500).json({ 
      message: "Error extracting website content. Please check the URL and try again." 
    });
  }
};
