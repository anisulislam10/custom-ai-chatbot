import Website from "./../models/web.content.models.js";
import axios from "axios";
import * as cheerio from 'cheerio';

// Crawl website & extract content
export const addWebsite = async (req, res) => {
  const { url } = req.body;

  if (!url) return res.status(400).json({ message: "Website URL is required" });

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);
    let content = $("body").text().replace(/\s+/g, " ").trim();

    const newWebsite = await Website.create({ url, content });

    const script = `<script src="https://your-deployed-chatbot.com/widget.js?websiteId=${newWebsite._id}"></script>`;
    
    res.json({ script });
  } catch (error) {
    res.status(500).json({ message: "Error extracting website content" });
  }
};
