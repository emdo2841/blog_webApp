import { Response } from "express";
import Like from "../models/like";
import { AuthRequest } from "../middleware/auth"; 

// ==========================================
// 1. TOGGLE LIKE (Handles Create & Delete)
// ==========================================
export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    // 🔴 FIX IS HERE: We cast req.body to tell TS what's inside
    const { blogId } = req.body as { blogId: string }; 

    if (!blogId) {
      res.status(400).json({ message: "Blog ID is required" });
      return;
    }

    // Check if the like already exists
    const existingLike = await Like.findOne({ blog: blogId, author: userId });

    if (existingLike) {
      // A. UNLIKE: If it exists, delete it
      await Like.findOneAndDelete({ _id: existingLike._id });

      res.status(200).json({
        success: true,
        message: "Blog unliked successfully",
        isLiked: false, 
      });
    } else {
      // B. LIKE: If it doesn't exist, create it
      await Like.create({
        blog: blogId,
        author: userId,
      });

      res.status(201).json({
        success: true,
        message: "Blog liked successfully",
        isLiked: true,
      });
    }
  } catch (err) {
    console.error("Error toggling like:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ==========================================
// 2. GET ALL LIKES FOR A BLOG (Read)
// ==========================================
export const getBlogLikes = async (req: AuthRequest, res: Response) => {
  try {
    // req.params is usually typed correctly by default, but you can cast it if needed
    const { blogId } = req.params as { blogId: string }; 

    const likes = await Like.find({ blog: blogId })
      .populate("author", "first_name surname image") 
      .sort({ createdAt: -1 }); 

    res.status(200).json({
      success: true,
      count: likes.length,
      data: likes,
    });
  } catch (err) {
    console.error("Error fetching likes:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ==========================================
// 3. CHECK IF USER LIKED A BLOG (Read)
// ==========================================
export const checkLikeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { blogId } = req.params as { blogId: string };

    const like = await Like.exists({ blog: blogId, author: userId });

    res.status(200).json({
      success: true,
      hasLiked: !!like, 
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};