import { Response } from "express";
import Comment from "../models/comment";
import Blog from "../models/blog"; 
import { AuthRequest } from "../middleware/auth";

// ==========================================
// 1. ADD COMMENT (Create)
// ==========================================
export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    // Type assertion for Body
    const { content, blogId } = req.body as { content: string; blogId: string };

    if (!content || !blogId) {
      res.status(400).json({ message: "Content and Blog ID are required" });
      return;
    }

    const newComment = await Comment.create({
      content,
      blog: blogId,
      author: userId,
    });

    await newComment.populate("author", "first_name surname image");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: newComment,
    });
  } catch (err) {
    console.error("Error adding comment:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ==========================================
// 2. GET COMMENTS FOR A BLOG (Read)
// ==========================================
export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    // 🔴 FIX 1: Cast params to include blogId
    const { blogId } = req.params as { blogId: string };

    const comments = await Comment.find({ blog: blogId })
      .populate("author", "first_name surname image") 
      .sort({ createdAt: -1 }); 

    res.status(200).json({
      success: true,
      count: comments.length,
      data: comments,
    });
  } catch (err) {
    console.error("Error fetching comments:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ==========================================
// 3. UPDATE COMMENT (Update)
// ==========================================
export const updateComment = async (req: AuthRequest, res: Response) => {
  try {
    // 🔴 FIX 2: Cast params to include commentId
    const { commentId } = req.params as { commentId: string };
    const { content } = req.body as { content: string };
    const userId = req.user?.id;

    // 1. Find the comment
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // 2. Check ownership
    if (comment.author.toString() !== userId) {
      res.status(403).json({ message: "Not authorized to edit this comment" });
      return;
    }

    // 3. Update and save
    comment.content = content || comment.content;
    await comment.save();

    res.status(200).json({
      success: true,
      message: "Comment updated",
      data: comment,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

// ==========================================
// 4. DELETE COMMENT (Delete)
// ==========================================
export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    // 🔴 FIX 3: Cast params to include commentId
    const { commentId } = req.params as { commentId: string };
    const userId = req.user?.id;

    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }

    // Check ownership 
    if (comment.author.toString() !== userId && req.user?.role !== "admin") {
      res.status(403).json({ message: "Not authorized to delete this comment" });
      return;
    }

    const blogId = comment.blog; 

    // Delete the comment
    await Comment.deleteOne({ _id: commentId });

    // Update count manually
    const count = await Comment.countDocuments({ blog: blogId });
    await Blog.findByIdAndUpdate(blogId, { commentCount: count });

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting comment:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
};