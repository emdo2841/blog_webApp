import express from "express"
import { category, getCategory } from "../controllers/category";


const categoryRoute = express.Router()

categoryRoute.get("/", getCategory)
categoryRoute.post("/", category)

export default categoryRoute
export {};