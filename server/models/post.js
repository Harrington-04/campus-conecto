import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorEmail: { type: String, required: true },
    text: { type: String, default: "" },
    imageThumb: { type: String, default: null },
    attachments: [{ name: String, url: String }],
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", postSchema);
export default Post;