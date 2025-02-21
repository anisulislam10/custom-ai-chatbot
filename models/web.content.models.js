import mongoose from "mongoose";

const WebsiteSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true,
        unique: true
    },
    content: {
        type: String
    },
});

export default mongoose.model("web-content", WebsiteSchema);
