import express from "express";
import { upload } from "../cloudinary"
import { verifyToken, verifyAdmin } from '../middleware/auth'
import { newBlog, getBlogs, getBlogById, updateBlog, deleteBlog, searchBlogs } from "../controllers/blog";

const blogRouter = express.Router();

blogRouter.post("/",  verifyToken, verifyAdmin, upload.array("images", 5), newBlog)
blogRouter.get("/", getBlogs)
blogRouter.get("/search", searchBlogs)
blogRouter.get("/:id", getBlogById)
blogRouter.put("/:id", verifyToken, verifyAdmin, upload.array("images", 5), updateBlog )
blogRouter.delete("/:id", verifyToken, verifyAdmin, deleteBlog)



export default blogRouter