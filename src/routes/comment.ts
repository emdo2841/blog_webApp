import express from "express";
import { verifyToken, verifyAdmin } from '../middleware/auth'
import { addComment, getComments, updateComment, deleteComment } from "../controllers/comment";

const commentRouter = express.Router();

// Toggle Like (POST /api/like) - Requires Login
// Body: { "blogId": "12345" }
commentRouter.post("/", verifyToken, addComment);

// Get who liked a specific blog (GET /api/like/blog/12345) - Public
commentRouter.get("/:blogId", getComments);

// Check if *I* liked a specific blog (GET /api/like/status/12345) - Requires Login
commentRouter.put("/", verifyToken,  updateComment);

commentRouter.delete("/",verifyToken, deleteComment )

export default commentRouter;