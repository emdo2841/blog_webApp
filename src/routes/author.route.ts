

import express from "express";
import {upload} from "../cloudinary"
import { getAuthors, getAuthorById, newAuthor, loginAuthor } from "../controllers/author.controller";

const authorRouter = express.Router();

authorRouter.get("/", getAuthors);
authorRouter.get("/:id", getAuthorById);
authorRouter.post("/", upload.single("image"), newAuthor)
authorRouter.post("/login", loginAuthor)

export default authorRouter;
