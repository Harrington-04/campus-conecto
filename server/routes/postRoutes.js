// server/routes/postRoutes.js
import express from "express";
import multer from "multer";
import streamifier from "streamifier";
import { protect } from "../middleware/authMiddleware.js";
import Post from "../models/post.js";
import cloudinary from "../config/cloudinaryConfig.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: Stream upload to Cloudinary
const streamUpload = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// ✅ Create a post
router.post("/", protect, upload.single("file"), async (req, res) => {
  try {
    let imageUrl = null;

    // If user uploaded an image
    if (req.file) {
      const result = await streamUpload(req.file.buffer, `posts/${req.user.email}`);
      imageUrl = result.secure_url;
    }

    // Parse attachments if provided
    let attachments = [];
    if (req.body.attachments) {
      try {
        attachments = JSON.parse(req.body.attachments);
      } catch (e) {
        console.error("❌ Attachments JSON parse error:", e.message);
      }
    }

    // Create the post in DB
    const newPost = await Post.create({
      user: req.user._id,
      authorEmail: req.user.email,
      text: req.body.text || "",
      imageThumb: imageUrl,
      attachments,
    });

    res.status(201).json({ success: true, data: newPost });
  } catch (err) {
    console.error("❌ Error creating post:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ✅ Get my posts
router.get("/me", protect, async (req, res) => {
  try {
    const posts = await Post.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ✅ Get feed (all posts)
router.get("/feed", protect, async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: posts });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// Add this new code to postRoutes.js

// ✅ UPDATE a post
router.put("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Make sure the logged-in user is the owner of the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "User not authorized" });
    }

    post.text = req.body.text || post.text;
    const updatedPost = await post.save();

    res.json({ success: true, data: updatedPost });
  } catch (err) {
    console.error("❌ Error updating post:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ DELETE a post
router.delete("/:id", protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Make sure the logged-in user is the owner of the post
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: "User not authorized" });
    }

    await post.deleteOne();

    res.json({ success: true, message: "Post removed" });
  } catch (err) {
    console.error("❌ Error deleting post:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
export default router;