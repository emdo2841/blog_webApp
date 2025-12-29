import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import Author, { IAuthor } from "../models/author.model";
import { uploadToCloudinary } from "../cloudinary";
import Blog from "../models/blog";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// controllers/author.controller.ts

export const getAuthors = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authors = await Author.find({}).sort({ createdAt: -1 }).select("first_name surname image email role");
    
    // 
    if (!authors || authors.length === 0) {
      // Even if empty, it's a "successful" call, just with empty data.
      // Ideally, return an empty array [] so the frontend .map works without errors.
      res.status(200).json({ 
          success: true, // ADD THIS
          message: "Oh no!! no authors added yet",
          data: []       // Return empty array instead of nothing
      });
      return;
    }

    res.status(200).json({
      success: true, // ADD THIS
      message: "Authors fetched successfully",
      data: authors,
    });
  } catch (err) {
    res.status(500).json({
      success: false, // ADD THIS
      message: "Fetching data failed with server error",
      error: err,
    });
  }
};

export const getAuthorById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const id = req.params.id;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        success: false, // ADD THIS
        message: "Provide a valid ID" 
      });
      return;
    }

    const author = await Author.findById(id).select("-password");
    
    if (!author) {
      res.status(404).json({ 
        success: false, // ADD THIS
        message: "Author not found" 
      });
      return;
    }

    // --- THE FIX IS HERE ---
    res.status(200).json({
      success: true, // <--- ADD THIS LINE
      message: "Author fetched successfully",
      data: author,
    });

  } catch (err) {
    res.status(500).json({
      success: false, // ADD THIS
      message: "Failed to fetch author",
      error: err,
    });
  }
};
export const newAuthor = async (
  req: Request<{}, {}, IAuthor> & { file?: Express.Multer.File },
  res: Response
) => {
  try {
    const { first_name, surname, email, password, role } = req.body;

    // 1. Validation
    if (!first_name || !surname || !email || !password) {
      res.status(400).json({ message: "Please enter all required fields" });
      return;
    }

    // 2. Check for existing user (Prevent duplicates)
    const userExists = await Author.findOne({ email });
    if (userExists) {
      res.status(400).json({ message: "User with this email already exists" });
      return;
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Handle Image Upload
    let imageUrl: string | null = null;
    if (req.file) {
      console.log("File received", req.file.originalname);
      // Assuming uploadToCloudinary is imported or defined in this file
      imageUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      console.log("Uploaded to Cloudinary:", imageUrl);
    }

    // 5. Create the Author
    const postAuthor = await Author.create({
      first_name,
      surname,
      email,
      password: hashedPassword, // Store the HASH, not the plain text
      role: role || "user",     // Default to user if not provided
      image: imageUrl,
    });

    // 6. Generate JWT Token
    // Ideally, store "secret_key" in process.env.JWT_SECRET
    const token = jwt.sign(
      { id: postAuthor._id, role: postAuthor.role },
      process.env.JWT_SECRET || "fallback_secret_dont_use_in_prod", 
      { expiresIn: "7d" } // Token expires in 7 days
    );

    // 7. Send Response
    res.status(201).json({
      success: true,
      message: "Author created successfully",
      token: token, // Send token to frontend
      data: {
        _id: postAuthor._id,
        first_name: postAuthor.first_name,
        surname: postAuthor.surname,
        email: postAuthor.email,
        role: postAuthor.role,
        image: postAuthor.image,
        // Do NOT return the password in the response
      },
    });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({
      message: "Server error",
      error: err,
    });
  }
};
export const loginAuthor = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validation: Ensure both fields are present
    if (!email || !password) {
      res.status(400).json({ message: "Please enter email and password" });
      return;
    }

    // 2. Find the user by email
    // We explicitly select the password because it might be set to select: false in your Schema
    const author = await Author.findOne({ email }).select("+password");

    if (!author) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // 3. Compare passwords
    // Compare the plain text password (req.body) with the hashed one (DB)
    const isMatch = await bcrypt.compare(password, author.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    // 4. Generate JWT Token (Same logic as registration)
    const token = jwt.sign(
      { id: author._id, role: author.role },
      process.env.JWT_SECRET || "fallback_secret_dont_use_in_prod",
      { expiresIn: "7d" }
    );

    // 5. Send Response
    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token, // Frontend will store this (e.g., localStorage)
      data: {
        _id: author._id,
        first_name: author.first_name,
        surname: author.surname,
        email: author.email,
        role: author.role,
        image: author.image,
      },
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({
      message: "Server error during login",
      error: err,
    });
  }
};