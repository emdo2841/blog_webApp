import express from "express";
import { verifyToken, verifyAdmin } from '../middleware/auth'
import { toggleLike, getBlogLikes, checkLikeStatus } from "../controllers/like";

const likeRouter = express.Router();

// Toggle Like (POST /api/like) - Requires Login
// Body: { "blogId": "12345" }
likeRouter.post("/", verifyToken, toggleLike);

// Get who liked a specific blog (GET /api/like/blog/12345) - Public
likeRouter.get("/blog/:blogId", getBlogLikes);

// Check if *I* liked a specific blog (GET /api/like/status/12345) - Requires Login
likeRouter.get("/status/:blogId", verifyToken, checkLikeStatus);

export default likeRouter;