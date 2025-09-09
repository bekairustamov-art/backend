import { Router } from "express";
import { subscribeTokenToTopic, sendPushToTopic } from "../services/pushService.js";

export const router = Router();

router.post(["/register", "/register/"], async (req, res) => {
  try {
    const { token, platform, app } = req.body || {};
    if (!token) return res.status(400).json({ success: false, message: "token required" });
    // subscribe the token to the 'all' topic
    try {
      await subscribeTokenToTopic(token, "all");
    } catch (err) {
      console.error("subscribeTokenToTopic error:", err.message);
      // Proceed anyway; app can still receive to /topics/all if token self-subscribes
    }
    res.json({ success: true, topic: "all" });
  } catch (err) {
    console.error("push/register error:", err);
    res.status(500).json({ success: false, message: "failed", error: err.message });
  }
});

router.post(["/send", "/send/"], async (req, res) => {
  try {
    const { title, body, data, image } = req.body || {};
    const result = await sendPushToTopic({ title, body, data, image, topic: "all" });
    res.json({ success: true, ...result });
  } catch (err) {
    console.error("push/send error:", err);
    res.status(500).json({ success: false, message: "failed", error: err.message });
  }
});


