// import mongoose, { Document, Schema, Types } from "mongoose";
// export interface IBlogPost extends Document {
//   title: string;
//   category: Types.ObjectId;
//   body: string;
//   author: Types.ObjectId;
//   reviews: Types.ObjectId[];
//   state: "draft" | "published";
//   createdAt: Date;
//     updatedAt: Date;
//     averageRating?: number; // Optional field for average rating
//   images?: string[]; // Optional field for image URL
// }

// const blogSchema = new Schema<IBlogPost>(
//   {
//     title: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     author: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Author',
//       required: true,
//     },
//     category: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Category",
//       // required: true,
//         },
//     averageRating: {
//         type: Number,
//         default: 0
//         },
//     images: {
//       type: [String],
//       required: true, 
     
//     },
//     body: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     reviews: {
//         type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
//         default: [],
//     }
//     // Automatically manage createdAt and updatedAt fields
//   },
//   { timestamps: true }
// );

// const Blog = mongoose.model<IBlogPost>("Blog", blogSchema);
// export default Blog;
import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBlogPost extends Document {
  title: string;
  category?: Types.ObjectId; // Marked optional based on your code
  body: string;
  author: Types.ObjectId;
  state: "draft" | "published";
  images: string[];
  createdAt: Date;
  updatedAt: Date;

  // 1. NEW: Counters for Likes and Comments
  likeCount: number;
  commentCount: number;

  // Legacy/Optional fields (If you are keeping the Review system too)
  reviews?: Types.ObjectId[];
  averageRating?: number; 
}

const blogSchema = new Schema<IBlogPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Author',
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    body: {
      type: String,
      required: true,
      trim: true,
    },
    images: {
      type: [String],
      required: true, 
      validate: [arrayLimit, '{PATH} must have at least 2 images'] // Optional: Add validator if you strictly need 2 images
    },
    state: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },
    
    // 2. NEW: Counter Fields (Updated automatically by Comment/Like models)
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },

    // Legacy Fields
    averageRating: {
      type: Number,
      default: 0
    },
    reviews: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Review" }],
      default: [],
    }
  },
  { timestamps: true }
);

// Optional: Helper to validate image array length
function arrayLimit(val: string[]) {
  return val.length >= 2;
}

const Blog = mongoose.model<IBlogPost>("Blog", blogSchema);
export default Blog;