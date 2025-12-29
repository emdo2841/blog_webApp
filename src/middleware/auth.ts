import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// 1. Define the shape of the User data inside the token
export interface AuthRequest<P = {}, ResBody = {}, ReqBody = {}, ReqQuery = {}> extends Request<P, ResBody, ReqBody, ReqQuery> {
  user?: {
    id: string;
    role: string;
  };
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // 2. Get the token from the header
    // Client sends: "Authorization: Bearer <token_string>"
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access denied. No token provided." });
      return;
    }

    // 3. Extract the actual token (remove "Bearer ")
    const token = authHeader.split(" ")[1];

    // 4. Verify the token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || "fallback_secret_dont_use_in_prod"
    ) as { id: string; role: string };

    // 5. Attach the user to the request object
    // Now your controllers can access req.user.id!
    req.user = decoded;

    // 6. Move to the next function (the controller)
    next();

  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
export const verifyAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Safety check: Ensure verifyToken ran first
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized. Please log in first." });
    return;
  }

  // Check the role
  if (req.user.role !== "admin") {
    res.status(403).json({ 
      success: false, 
      message: "Access denied. Admins only." 
    });
    return;
  }

  // If role is admin, proceed
  next();
};