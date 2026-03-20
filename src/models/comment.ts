import mongoose, { Document, Schema, Types } from "mongoose";
// ❌ DELETE THIS LINE to prevent circular dependency
// import Blog from "./blog"; 

export interface IComment extends Document {
  content: string;
  blog: Types.ObjectId;
  author: Types.ObjectId;
  createdAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    content: { type: String, required: true, trim: true },
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Author", required: true },
  },
  { timestamps: true }
);

// 🧠 AUTOMATION: Update the Blog's commentCount when a comment is saved
commentSchema.post("save", async function (doc) {
  try {
    const blogId = doc.blog;
    // Count all comments
    const count = await mongoose.model("Comment").countDocuments({ blog: blogId });
    
    // ✅ FIX: Use mongoose.model("Blog") instead of the imported variable
    await mongoose.model("Blog").findByIdAndUpdate(blogId, { commentCount: count });
  } catch (err) {
    console.error("Error updating comment count:", err);
  }
});

// 🧠 AUTOMATION: Update on Delete
commentSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    try {
      const blogId = doc.blog;
      const count = await mongoose.model("Comment").countDocuments({ blog: blogId });
      
      // ✅ FIX: Use mongoose.model("Blog")
      await mongoose.model("Blog").findByIdAndUpdate(blogId, { commentCount: count });
    } catch (err) {
      console.error("Error updating comment count on delete:", err);
    }
  }
});

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;