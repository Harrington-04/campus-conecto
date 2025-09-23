import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import multer from "multer";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";

import User from "../models/user.js";
import OTP from "../models/otp.js";
import { sendWelcomeEmail, sendPasswordResetOTP } from "../utils/emailsender.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer();

// --- JWT helper ---
const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// --- Validation wrapper ---
const validate = (validations) => async (req, res, next) => {
  await Promise.all(validations.map((validation) => validation.run(req)));
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.param, msg: e.msg })),
    });
  }
  next();
};

// ------------------------------------
// REGISTER
// ------------------------------------
router.post(
  "/register",
  // 1. Username validation is REMOVED from this list.
  validate([
    body("fullName")
      .isString()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ]),
  async (req, res) => {
    try {
      // 2. 'username' is REMOVED from the destructured variables.
      const { fullName, email, password, qualification, branch, year, subjects } = req.body;

      const existing = await User.findOne({ email });
      if (existing)
        return res.status(400).json({ success: false, message: "User already exists" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // 3. 'username' is REMOVED from the new user object.
      const newUser = new User({
        fullName,
        email,
        passwordHash: hashedPassword,
        qualification,
        branch,
        year,
        subjects,
      });

      const saved = await newUser.save();
      try {
        await sendWelcomeEmail(saved.email, saved.fullName);
      } catch (err) {
        console.error("❌ Welcome email failed:", err.message);
        // important: do not throw, still return success
      }

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: {
          _id: saved._id,
          fullName: saved.fullName,
          email: saved.email,
          token: generateToken(saved._id),
        },
      });
    } catch (err) {
      console.error("❌ Register error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ------------------------------------
// LOGIN (No changes here)
// ------------------------------------
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match)
      return res.status(400).json({ success: false, message: "Invalid email or password" });

    res.json({
      success: true,
      data: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profileCreated: user.profileCreated,
        token: generateToken(user._id),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ------------------------------------
// UPDATE PROFILE (No changes here - this correctly handles adding the username later)
// ------------------------------------
router.post("/profile", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (req.body.username) {
      const usernameExists = await User.findOne({ username: req.body.username });
      if (usernameExists && usernameExists._id.toString() !== req.user._id.toString()) {
        return res.status(400).json({ success: false, message: "Username is already taken." });
      }
      user.username = req.body.username;
    }

    if (req.body.college) user.college = req.body.college;
    if (req.body.bio) user.bio = req.body.bio;
    if (req.body.profileImageUrl) user.profileImageUrl = req.body.profileImageUrl;

    user.profileCreated = true;
    const updated = await user.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Server error updating profile" });
  }
});

// GET PROFILE (No changes here)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash")
      .populate("friends", "_id fullName email profileImageUrl");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({
      success: true,
      message: "User profile fetched successfully",
      data: user,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error fetching profile" });
  }
});

// SEARCH USERS (No changes here)
router.get("/search", protect, async (req, res) => {
  try {
    const { q, mode } = req.query;
    if (!q) return res.json({ success: true, data: [] });

    const regex = new RegExp(q, "i");
    let criteria = {};

    if (mode === "email") criteria = { email: regex };
    else if (mode === "username") criteria = { username: regex };
    else criteria = { fullName: regex };

    const users = await User.find({
      ...criteria,
      _id: { $ne: req.user._id },
    }).select("_id fullName username email profileImageUrl");

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ADD FRIEND (No changes here)
router.post("/add-friend", protect, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ success: false, message: "friendId required" });
    if (friendId === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot add yourself" });

    const user = await User.findById(req.user._id);
    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ success: false, message: "Friend not found" });

    if (!user.friends.includes(friendId)) user.friends.push(friendId);
    if (!friend.friends.includes(user._id)) friend.friends.push(user._id);

    await user.save();
    await friend.save();

    req.io.to(friendId).emit("notification", { message: `${user.fullName} added you as a friend!` });
    req.io.to(user._id.toString()).emit("notification", { message: `You are now friends with ${friend.fullName}!` });

    res.json({ success: true, message: "Friend added!", data: user.friends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// REMOVE FRIEND
router.post("/remove-friend", protect, async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ success: false, message: "friendId required" });
    if (friendId === req.user._id.toString()) return res.status(400).json({ success: false, message: "Cannot remove yourself" });

    const user = await User.findById(req.user._id);
    const friend = await User.findById(friendId);
    if (!friend) return res.status(404).json({ success: false, message: "Friend not found" });

    // Remove from both sides
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== req.user._id.toString());

    await user.save();
    await friend.save();

    // Optional: notify users
    try {
      req.io.to(friendId).emit("notification", { message: `${user.fullName} removed you from friends.` });
      req.io.to(user._id.toString()).emit("notification", { message: `You removed ${friend.fullName} from friends.` });
    } catch {}

    res.json({ success: true, message: "Friend removed.", data: user.friends });
  } catch (err) {
    console.error("❌ Remove friend error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ------------------------------------
// PASSWORD RESET - SEND OTP
// ------------------------------------
router.post(
  "/password/send-otp",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
  ]),
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: "No user found with this email" });

      // Remove existing OTPs for this email
      await OTP.deleteMany({ email });

      // Create a 6-digit numeric OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

      await OTP.create({ email, otp: otpCode });

      // Dev-mode fallback
      if (process.env.DEV_LOG_OTP === 'true') {
        console.log(`🔐 DEV OTP for ${email}: ${otpCode}`);
        return res.json({ success: true, message: "OTP generated (DEV mode)", dev: true });
      }

      // Send email
      const sent = await sendPasswordResetOTP(email, otpCode);
      if (!sent) {
        return res.status(500).json({ success: false, message: "Failed to send OTP email" });
      }

      res.json({ success: true, message: "OTP sent to email" });
    } catch (err) {
      console.error("❌ Send OTP error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ------------------------------------
// COMPAT: LEGACY FORGOT PASSWORD ENDPOINT
// Mirrors /password/send-otp for older frontends calling /users/forgot-password
// ------------------------------------
router.post(
  "/forgot-password",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
  ]),
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: "No user found with this email" });

      await OTP.deleteMany({ email });
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      await OTP.create({ email, otp: otpCode });

      // Dev-mode fallback
      if (process.env.DEV_LOG_OTP === 'true') {
        console.log(`🔐 DEV OTP for ${email}: ${otpCode}`);
        return res.json({ success: true, message: "OTP generated (DEV mode)", dev: true });
      }

      const sent = await sendPasswordResetOTP(email, otpCode);
      if (!sent) {
        return res.status(500).json({ success: false, message: "Failed to send OTP email" });
      }

      res.json({ success: true, message: "OTP sent to email" });
    } catch (err) {
      console.error("❌ Legacy forgot-password OTP error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ------------------------------------
// PASSWORD RESET - VERIFY OTP
// ------------------------------------
router.post(
  "/password/verify-otp",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp").isLength({ min: 4 }).withMessage("OTP is required"),
  ]),
  async (req, res) => {
    try {
      const { email, otp } = req.body;
      const record = await OTP.findOne({ email, otp });
      if (!record) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      res.json({ success: true, message: "OTP verified" });
    } catch (err) {
      console.error("❌ Verify OTP error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ------------------------------------
// PASSWORD RESET - RESET PASSWORD
// ------------------------------------
router.post(
  "/password/reset",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp").isLength({ min: 4 }).withMessage("OTP is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ]),
  async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      const record = await OTP.findOne({ email, otp });
      if (!record) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      // Invalidate OTPs for this email
      await OTP.deleteMany({ email });

      res.json({ success: true, message: "Password reset successful" });
    } catch (err) {
      console.error("❌ Reset password error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ------------------------------------
// COMPAT: LEGACY RESET PASSWORD ENDPOINTS
// Mirrors /password/reset
// ------------------------------------
router.post(
  "/reset-password",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp").isLength({ min: 4 }).withMessage("OTP is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ]),
  async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      const record = await OTP.findOne({ email, otp });
      if (!record) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      await OTP.deleteMany({ email });

      res.json({ success: true, message: "Password reset successful" });
    } catch (err) {
      console.error("❌ Reset password (compat) error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post(
  "/forgot-password/reset",
  validate([
    body("email").isEmail().withMessage("Valid email is required"),
    body("otp").isLength({ min: 4 }).withMessage("OTP is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ]),
  async (req, res) => {
    try {
      const { email, otp, newPassword } = req.body;

      const record = await OTP.findOne({ email, otp });
      if (!record) return res.status(400).json({ success: false, message: "Invalid or expired OTP" });

      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ success: false, message: "User not found" });

      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(newPassword, salt);
      await user.save();

      await OTP.deleteMany({ email });

      res.json({ success: true, message: "Password reset successful" });
    } catch (err) {
      console.error("❌ Reset password (compat 2) error:", err);
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

export default router;
