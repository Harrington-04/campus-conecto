import express from "express";
import multer from "multer";
import { protect } from "../middleware/authMiddleware.js";
import cloudinary from "../config/cloudinaryConfig.js";
import streamifier from "streamifier";
import axios from "axios";   // ✅ for proxying files
import path from "path";     // ✅ for safe filename extraction
import mime from "mime-types"; // ✅ for extension inference from Content-Type

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for docs/resources
});

const sanitize = (s = "") => s.replace(/[^a-zA-Z0-9._-]/g, "_");

// ✅ Upload profile images
router.post(
  "/profile-image",
  protect,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      if (!req.file.mimetype.startsWith("image/")) {
        return res.status(400).json({ success: false, message: "Only image files are allowed" });
      }

      const email = req.user?.email || "user";
      const safeEmail = sanitize(email);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `profile-images/${safeEmail}`,
          public_id: `profile_${Date.now()}`,
          resource_type: "image",
          transformation: [
            { width: 400, height: 400, crop: "fill" },
            { quality: "auto" }
          ]
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            return res.status(500).json({
              success: false,
              message: "Failed to upload profile image",
              error: error.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Profile image uploaded successfully",
            url: result.secure_url,
            type: req.file.mimetype,
            size: req.file.size,
          });
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (err) {
      console.error("❌ Profile image upload error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to upload profile image",
        error: err.message,
      });
    }
  }
);

// ✅ Upload generic resources (PDF, DOCX, PPT, etc.)
router.post(
  "/resource",
  protect,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
      }

      const email = req.user?.email || "user";
      const safeEmail = sanitize(email);

      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `resources/${safeEmail}`,
          public_id: sanitize(req.file.originalname.split(".")[0]),
          resource_type: req.file.mimetype === "application/pdf" ? "raw" : "auto",
        },
        (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            return res.status(500).json({
              success: false,
              message: "Failed to upload resource",
              error: error.message,
            });
          }

          return res.status(201).json({
            success: true,
            message: "Resource uploaded successfully",
            name: req.file.originalname,
            url: result.secure_url,
            type: req.file.mimetype,
            size: req.file.size,
          });
        }
      );

      streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
    } catch (err) {
      console.error("❌ Upload error:", err);
      return res.status(500).json({
        success: false,
        message: "Failed to upload resource",
        error: err.message,
      });
    }
  }
);

// ✅ Proxy download route (fixes PDF 401s, supports token in query)
router.get(
  "/download",
  // Inject Authorization header from ?token= if missing
  (req, _res, next) => {
    if (!req.headers.authorization && req.query?.token) {
      req.headers.authorization = `Bearer ${req.query.token}`;
    }
    next();
  },
  protect,
  async (req, res) => {
    try {
      const { url, name } = req.query;
      if (!url) return res.status(400).send("Missing url query param");

      // Backward-compat: if a PDF is requested from image delivery, switch to raw
      let finalUrl = url;
      const isPdf = /\.pdf(\?.*)?$/i.test(url);
      if (isPdf && url.includes("/image/upload/")) {
        finalUrl = url.replace("/image/upload/", "/raw/upload/");
      }

      // Stream from Cloudinary/source
      const response = await axios({ url: finalUrl, method: "GET", responseType: "stream" });

      // --- Ensure filename has proper extension ---
      const fallbackName = path.basename((finalUrl || "").split("?")[0]) || "download";
      let fileName = (name || fallbackName || "download").trim();

      const contentTypeHeader = (response.headers["content-type"] || "").split(";")[0].trim();
      const extFromCTMap = {
        "application/pdf": ".pdf",
        "application/msword": ".doc",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
        "application/vnd.ms-powerpoint": ".ppt",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
        "application/vnd.ms-excel": ".xls",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
        "application/zip": ".zip",
        "application/x-zip-compressed": ".zip",
        "text/plain": ".txt",
        "text/csv": ".csv",
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
      };

      const hasExt = !!path.extname(fileName);
      if (!hasExt) {
        let ext = "";
        // 1) Try from Content-Type: prefer mime-types, then fallback map
        if (contentTypeHeader) {
          const mimeExt = mime.extension(contentTypeHeader);
          if (mimeExt) {
            ext = `.${mimeExt}`;
          } else if (extFromCTMap[contentTypeHeader]) {
            ext = extFromCTMap[contentTypeHeader];
          } else if (contentTypeHeader.startsWith("image/")) {
            const sub = contentTypeHeader.split("/")[1];
            if (sub) {
              const normalized = sub.toLowerCase() === "jpeg" ? "jpg" : sub.toLowerCase();
              ext = `.${normalized}`;
            }
          }
        }
        // 2) Fallback from URL path
        if (!ext) {
          try {
            const u = new URL(finalUrl);
            const urlExt = path.extname(u.pathname);
            if (urlExt) ext = urlExt;
          } catch {}
        }
        // 3) If still missing and it's clearly a pdf case we rewrote, enforce .pdf
        if (!ext && isPdf) ext = ".pdf";

        if (ext && !fileName.toLowerCase().endsWith(ext.toLowerCase())) {
          fileName += ext;
        }
      }

      // Set headers and stream
      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", response.headers["content-type"] || "application/octet-stream");
      if (response.headers["content-length"]) {
        res.setHeader("Content-Length", response.headers["content-length"]);
      }

      response.data.pipe(res);
    } catch (err) {
      console.error("❌ Proxy download error:", err?.message || err);
      res.status(500).json({ success: false, message: "Failed to proxy download" });
    }
  }
);

export default router;