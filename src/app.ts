import express, { Request, Response } from "express";
import dotenv from "dotenv";
dotenv.config();
import { connectToDb } from "./db"; 
import authorRouter from "./routes/author.route";
import blogRouter from "./routes/blog.route"
import categoryRoute from "./routes/category";
import likeRouter from "./routes/like"
import commentRouter from "./routes/comment"
import newsletterRouter from "./routes/newsletter";
import cors from "cors"; // Add this import
const app = express();

app.use(cors({
  origin: "http://localhost:5173", // Allow your React app
  credentials: true
}));
app.use(express.json())
app.use("/api/author", authorRouter)
app.use("/api/blog", blogRouter )
app.use("/api/category", categoryRoute)
app.use("/api/like", likeRouter)
app.use("/api/comment", commentRouter)
app.use("/api/newsletter", newsletterRouter)


// Connect to the database
connectToDb()
const port = 8080;
app.get("/", ( req: Request, res: Response) => {
    res.status(200).end("Hello, World!");
})

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})