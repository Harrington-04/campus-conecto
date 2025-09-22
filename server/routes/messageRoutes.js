import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import Message from "../models/message.js";
import User from "../models/user.js"; // Import the User model

const router = express.Router();

// Get messages with one friend
router.get("/:friendId", protect, async (req, res) => {
  try {
    const msgs = await Message.find({
      $or: [
        { from: req.user._id, to: req.params.friendId },
        { from: req.params.friendId, to: req.user._id },
      ],
    }).sort({ createdAt: -1 });
    res.json({ success: true, data: msgs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send a new message
router.post("/send/:friendId", protect, async (req, res) => {
  try {
    const message = await Message.create({
      from: req.user._id,
      to: req.params.friendId,
      text: req.body.text,
    });

    // Find the sender to get their name for the notification message
    const sender = await User.findById(req.user._id);

    // 1. Emit the actual message data to the recipient's chat window
    req.io.to(req.params.friendId).emit("newMessage", {
      from: req.user._id.toString(),
      text: message.text,
      createdAt: message.createdAt,
    });

    // 2. Emit a separate notification to the recipient's homepage
    if (sender) {
        req.io.to(req.params.friendId).emit("notification", {
            message: `New message from ${sender.fullName}`,
        });
    }

    res.json({ success: true, data: message });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;