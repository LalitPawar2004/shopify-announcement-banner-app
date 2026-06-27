import express from "express";
import Announcement from "../models/Announcement.js";
import shopify from "../shopify.js";

const router = express.Router();

// POST /api/announcement - Save announcement to DB + Shopify Metafield
router.post("/api/announcement", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Announcement text is required" });
    }

    // 1. Save to MongoDB (audit history)
    const announcement = await Announcement.create({ text: text.trim() });

    // 2. Sync to Shopify Metafield using REST API
    const session = res.locals.shopify.session;
    const client = new shopify.api.clients.Rest({ session });

    const metafieldResponse = await client.post({
      path: "metafields",
      data: {
        metafield: {
          namespace: "my_app",
          key: "announcement",
          value: text.trim(),
          type: "single_line_text_field",
        },
      },
    });

    res.status(201).json({
      message: "Announcement saved and synced to storefront",
      announcement,
      metafield: metafieldResponse.body.metafield,
    });
  } catch (error) {
    console.error("Save error:", error);
    res.status(500).json({ error: "Failed to save announcement" });
  }
});

// GET /api/announcement - Fetch latest announcement (for dashboard display)
router.get("/api/announcement", async (req, res) => {
  try {
    const latest = await Announcement.findOne().sort({ createdAt: -1 });
    res.status(200).json({ announcement: latest });
  } catch (error) {
    console.error("Fetch error:", error);
    res.status(500).json({ error: "Failed to fetch announcement" });
  }
});

export default router;