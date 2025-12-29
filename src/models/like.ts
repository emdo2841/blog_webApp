import mongoose, { Document, Schema, Types } from "mongoose";
// ❌ DELETE THIS LINE
// import Blog from "./blog"; 

export interface ILike extends Document {
  blog: Types.ObjectId;
  author: Types.ObjectId;
}

const likeSchema = new Schema<ILike>(
  {
    blog: { type: mongoose.Schema.Types.ObjectId, ref: "Blog", required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "Author", required: true },
  },
  { timestamps: true }
);

likeSchema.index({ blog: 1, author: 1 }, { unique: true });

// 🧠 AUTOMATION: Update count on Save
likeSchema.post("save", async function (doc) {
  try {
    const blogId = doc.blog;
    const count = await mongoose.model("Like").countDocuments({ blog: blogId });
    
    // ✅ FIX: Use mongoose.model("Blog")
    await mongoose.model("Blog").findByIdAndUpdate(blogId, { likeCount: count });
  } catch (err) {
    console.error("Error updating like count:", err);
  }
});

// 🧠 AUTOMATION: Update count on Delete
likeSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    try {
      const blogId = doc.blog;
      const count = await mongoose.model("Like").countDocuments({ blog: blogId });
      
      // ✅ FIX: Use mongoose.model("Blog")
      await mongoose.model("Blog").findByIdAndUpdate(blogId, { likeCount: count });
    } catch (err) {
      console.error("Error updating like count on delete:", err);
    }
  }
});

const Like = mongoose.model<ILike>("Like", likeSchema);
export default Like;