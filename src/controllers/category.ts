import BlogCategory,{IBlogCategory} from "../models/categories"
import { Request, Response } from "express"

export const category = async ( req: Request<{}, {}, IBlogCategory>, res:Response) =>{
    const name = req.body
    try {
        
    if(!name){
       res.status(400).json({
        success: false,
        message:"provide name of category"
       }) 
    }
    const category = await BlogCategory.create({name})
    res.status(201).json({
        success: true,
        message: "New category created successfully",
        data: category
    })

    }catch(err){
        console.log(`error occurred ${err}`)
        res.status(500).json({
            success: false,
            error: "server error",

        })

    }
}

export const getCategory = async(req: Request, res:Response) =>{
    try{
        const category = await BlogCategory.find({}).sort({createdAt:-1})
        if (!category || category.length === 0) {
      res.status(200).json({ message: "Oh no!! no category added yet" });
      return;
      
    }
    res.status(200).json({
        success: true,
        message: "category fetch successfully",
        data: category
      })

    }catch (err){
        console.error(`error occurred ${err}`)
        res.status(500).json({
            success: false,
            message: "server error while trying to fetch category"
        })
    }
}