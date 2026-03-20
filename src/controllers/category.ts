import BlogCategory,{IBlogCategory} from "../models/categories"
import { Request, Response } from "express"



export const category = async (req: Request<{}, {}, IBlogCategory>, res: Response) => {
    try {
        // 1. FIX: Destructure 'name' from req.body
        const { name } = req.body; 

        // 2. FIX: Add 'return' to stop execution if validation fails
        if (!name) {
            res.status(400).json({
                success: false,
                message: "Please provide the name of the category"
            });
            return; // <--- Crucial: Stop the function here
        }

        // 3. Create the category
        // Since we extracted 'name' as a string above, { name } is now valid shorthand for { name: name }
        const newCategory = await BlogCategory.create({ name });

        res.status(201).json({
            success: true,
            message: "New category created successfully",
            data: newCategory
        });

    } catch (err) {
        console.error(`Error creating category:`, err);
        res.status(500).json({
            success: false,
            message: "Server error while creating category",
            error: err
        });
    }
};

// ... keep your existing getCategory function ...

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