import Blog, { IBlogPost } from "../models/blog";
import mongoose from "mongoose";
import { uploadToCloudinary } from "../cloudinary";
import { Request, Response } from "express";
import redisClient from "../redis"
import { json } from "body-parser";
import { verifyToken } from '../middleware/auth'
import { AuthRequest } from "../middleware/auth";
import Author from "../models/author.model"; // Or "../models/user" if that's what you use

export const newBlog = async (
  req: AuthRequest<{}, {}, IBlogPost>, // Use AuthRequest here
  res: Response
) => {
  try {
    // 1. Get Author ID from the Token (Checked by verifyToken)
    const authorId = req.user?.id;
    
    // 2. Extract Body Data
    const { title, body, state, category } = req.body;

    if (!title || !body || !category) {
      res.status(400).json({ message: "Provide title and body" });
      return;
    }
    
    // 3. Image Validation
    // Cast to Multer array to fix TS errors
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length < 2) {
      res.status(400).json({
        success: false,
        message: "Please provide at least 2 images",
      });
      return;
    }

    // 4. Upload Images in Parallel (Faster)
    const uploadPromises = files.map(file => 
      uploadToCloudinary(file.buffer, file.originalname)
    );
    const uploadedUrls = await Promise.all(uploadPromises);
    
    // Filter out any failed uploads (nulls)
    const validImageUrls = uploadedUrls.filter((url): url is string => url !== null);

    // 5. Create Database Entry
    // Use .create() instead of new Blog() + save()
    const newPostBlog = await Blog.create({
      title,
      state: state || "draft",
      author: authorId,// Automatically link to the logged-in admin
      body,
      category,
      images: validImageUrls,
    });

    res.status(201).json({
      message: "Blog successfully created",
      data: newPostBlog,
    });

  } catch (err) {
    console.error("Error creating blog:", err);
    res.status(500).json({
      success: false,
      message: "Server error: Blog creation failed",
      error: err,
    });
  }
};
export const getBlogs = async (req: Request, res: Response) => {
    try {
        const cacheBlogs = await redisClient.get(`blogs`);
        if (cacheBlogs) {
            res.status(200).json({
                success: true,
                message: "blog fetched successfully from redis",
                data: JSON.parse(cacheBlogs),
            });
            return;
        }

        const blog = await Blog.find({}).populate("author").populate("category").sort({createdAt:-1});
        if (!blog || blog.length === 0) {
            res.status(404).json({
                message: "Oh No!! Blog Post",
            });
            return;
        }

        // FIX 1: Store the actual blog data, not the string "blogs"
        await redisClient.setEx("blogs", 300, JSON.stringify(blog)); 

        res.status(200).json({
            success: true,
            message: "Blog fetch successfully",
            data: blog, // Corrected typo from datat to data
        });
    } catch (err) {
        console.log(`server error ${err}`);
        
        // FIX 2: Use res.status(500).json(...) to properly close the request
        res.status(500).json({ 
            success: false,
            message: "server error while trying to fetch blog",
            error: err,
        });
    }
};

export const getBlogById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id;

    // FIX 1: Use OR (||) not AND (&&)
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: "provide a valid id",
      });
      return; // Add return to stop execution
    }

    const cacheKey = `blogs${id}`;
    const cachedBlog = await redisClient.get(cacheKey);

    if (cachedBlog) {
      res.status(200).json({
        success: true,
        message: "blog fetched from cache",
        data: JSON.parse(cachedBlog),
      });
      return;
    }

    // FIX 2: Add .populate("author") so the frontend gets names, not just IDs
    const blog = await Blog.findById(id).populate("author");

    if (!blog) {
        res.status(404).json({ success: false, message: "Blog not found" });
        return;
    }

    // FIX 3: Use cacheKey, not the static string "blog"
    await redisClient.setEx(cacheKey, 300, JSON.stringify(blog));

    res.status(200).json({
      success: true,
      message: "Blog fetched successfully", // Fixed typo "meassage"
      data: blog,
    });
  } catch (err) {
    console.log(`server error occured while fetching blog ${err}`);
    res.status(500).json({ // Changed 505 (HTTP Version Not Supported) to 500 (Server Error)
      success: false,
      message: "error fetching blog",
      error: err,
    });
  }
};

// ==========================================
// 4. UPDATE BLOG
// ==========================================
export const updateBlog = async (
  req: AuthRequest<{ id: string }, {}, Partial<IBlogPost>>,
  res: Response
) => {
  try {
    const { id } = req.params;
    
    // FIX 1: Add 'category' to the destructuring
    const { title, body, state, category } = req.body; 
    
    const userId = req.user?.id;

    // 1. Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid blog ID" });
      return;
    }

    // 2. Find existing blog
    const blog = await Blog.findById(id);
    if (!blog) {
      res.status(404).json({ success: false, message: "Blog not found" });
      return;
    }

    // 3. Check Ownership
    if (blog.author.toString() !== userId) {
      res.status(403).json({ success: false, message: "Not authorized to update this blog" });
      return;
    }

    // 4. Handle Image Updates
    let updatedImages = blog.images;
    const files = req.files as Express.Multer.File[];

    if (files && files.length > 0) {
      if (files.length < 2) {
         res.status(400).json({success: false, message: "If updating images, please provide at least 2"});
         return;
      }
      const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, file.originalname));
      const uploadedUrls = await Promise.all(uploadPromises);
      updatedImages = uploadedUrls.filter((url): url is string => url !== null);
    }

    // 5. Update Database Entry
    const updatedBlog = await Blog.findByIdAndUpdate(
      id,
      {
        title: title || blog.title,
        body: body || blog.body,
        state: state || blog.state,
        
        // FIX 2: Add the category update logic here
        category: category || blog.category, 
        
        images: updatedImages,
        updatedAt: Date.now(),
      },
      { new: true }
    )
    .populate("author")
    .populate("category"); // FIX 3: Populate category so frontend updates the badge immediately

    // --- REDIS CACHE INVALIDATION ---
    await redisClient.del(`blogs${id}`);
    await redisClient.del("blogs");

    res.status(200).json({
      success: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });

  } catch (err) {
    console.error("Error updating blog:", err);
    res.status(500).json({
      success: false,
      message: "Server error during update",
      error: err,
    });
  }
};

// ==========================================
// 5. DELETE BLOG
// ==========================================
export const deleteBlog = async (req: AuthRequest<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const userRole = req.user?.role; // Assuming your user token has a role string

    // 1. Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: "Invalid blog ID" });
      return;
    }

    // 2. Find blog to check ownership
    const blog = await Blog.findById(id);
    if (!blog) {
      res.status(404).json({ success: false, message: "Blog not found" });
      return;
    }

    // 3. Check Permission
    // Allow deletion if the user is the author OR if the user is an 'admin'
    if (blog.author.toString() !== userId && userRole !== 'admin') {
      res.status(403).json({ success: false, message: "Not authorized to delete this blog" });
      return;
    }

    // 4. Delete from Database
    await Blog.findByIdAndDelete(id);
    
    // TODO: Ideally, delete associated images from Cloudinary here.

    // --- REDIS CACHE INVALIDATION ---
    // 1. Clear the specific blog's cache entry.
    await redisClient.del(`blogs${id}`);
    // 2. Clear the main list cache so the deleted blog no longer appears.
    await redisClient.del("blogs");

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully",
    });

  } catch (err) {
    console.error("Error deleting blog:", err);
    res.status(500).json({
      success: false,
      message: "Server error during deletion",
      error: err,
    });
  }
};
export const searchBlogs = async (req: Request, res: Response) => {
  try {
    const { q } = req.query; // Get ?q=keyword from URL

    if (!q || typeof q !== 'string') {
      res.status(400).json({ success: false, message: "Search query is required" });
      return;
    }

    // Create a case-insensitive Regex (e.g., "john" matches "John", "JOHN")
    const searchRegex = new RegExp(q, "i");

    // STEP 1: Find Authors matching the name
    const matchingAuthors = await Author.find({
      $or: [
        { first_name: searchRegex },
        { surname: searchRegex }
      ]
    }).select("_id"); // We only need their IDs

    const authorIds = matchingAuthors.map(a => a._id);

    // STEP 2: Find Blogs matching Title OR matching Author IDs
    const blogs = await Blog.find({
      $or: [
        { title: searchRegex },        // Match Title
        { author: { $in: authorIds } } // OR Match Author ID
      ]
    }).populate("author").sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: blogs,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Search failed", error: err });
  }
};

export const getTrendingBlogs = async (req: Request, res: Response) => {
  try {
    // 1. Define "Recent": Only look at posts from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 2. Fetch candidates (we assume trending news is usually recent)
    // We select only necessary fields to make the fetch fast
    const recentBlogs = await Blog.find({
      createdAt: { $gte: sevenDaysAgo },
      state: "published" 
    }).populate("author", "first_name surname image");

    // 3. Apply the Algorithm
    const trendingBlogs = recentBlogs.map((blog) => {
      const blogData = blog.toObject();
      
      // Calculate Time in Hours since creation
      const timeInHours = (Date.now() - new Date(blog.createdAt).getTime()) / (1000 * 60 * 60);
      
      // Prevent division by zero or negative gravity
      const gravity = Math.pow(timeInHours + 2, 1.5);

      // Weighted Score: Comments are worth 2x likes
      const score = ((blog.likeCount * 1) + (blog.commentCount * 2)) / gravity;

      return { ...blogData, trendingScore: score };
    });

    // 4. Sort by Score (Highest first) and take top 5
    trendingBlogs.sort((a, b) => b.trendingScore - a.trendingScore);
    const topTrending = trendingBlogs.slice(0, 5);

    res.status(200).json({
      success: true,
      data: topTrending,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching trending news" });
  }
};export const getBlogsByCategory = async (req: Request, res: Response) => {
  try {
    // 1. We extract 'categoryId' because the route is now /category/:categoryId
    const { categoryId } = req.params;

    // 2. Validate
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      res.status(400).json({ success: false, message: "Invalid Category ID" });
      return; 
    }

    // 3. Find blogs matching this category
    const blogs = await Blog.find({ 
      category: categoryId,
      state: "published"
    })
    .populate("author", "first_name surname image")
    .populate("category")
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: blogs,
    });

  } catch (err) {
    console.error("Error fetching category blogs:", err);
    res.status(500).json({ success: false, message: "Server error", error: err });
  }
};