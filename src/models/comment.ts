import mongoose, { Document, Schema, Types } from "mongoose";
import Blog from "./blog"; 

export interface IComment extends Document {
  content: string;
  blog: Types.ObjectId;
  author: Types.ObjectId;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: {
      type: String,
      required: true,
      trim: true,
    },
    blog: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
      required: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Author",
      required: true,
    },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// 🧠 AUTOMATION: Update the Blog's commentCount when a comment is saved
commentSchema.post("save", async function (doc) {
  try {
    const blogId = doc.blog;
    // Count all comments for this blog
    const count = await mongoose.model("Comment").countDocuments({ blog: blogId });
    
    // Update the Blog model
    await Blog.findByIdAndUpdate(blogId, { commentCount: count });
  } catch (err) {
    console.error("Error updating comment count:", err);
  }
});
// Add this to your src/models/comment.ts file
commentSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    try {
      const blogId = doc.blog;
      const count = await mongoose.model("Comment").countDocuments({ blog: blogId });
      await Blog.findByIdAndUpdate(blogId, { commentCount: count });
    } catch (err) {
      console.error("Error updating comment count on delete:", err);
    }
  }
});

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;