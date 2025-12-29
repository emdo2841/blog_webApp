import express from "express";
import { subscribeToNewsletter } from "../controllers/newsletter";

const newsletterRouter = express.Router();

newsletterRouter.post("/subscribe", subscribeToNewsletter);

export default newsletterRouter;