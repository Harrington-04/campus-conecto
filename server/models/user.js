import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, trim: true, lowercase: true, unique: true, sparse: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },

    // Details from Signup Page
    qualification: { type: String, default: "" }, // Stream
    branch: { type: String, default: "" },
    year: { type: String, default: "" },
    subjects: { type: [String], default: [] },

    // Details from Profile Creation Page
    college: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true },
    profileImageUrl: { type: String, default: null },
    
    profileCreated: { type: Boolean, default: false },
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Password reset (token-based) — optional
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);
export default User;