
import mongoose, { Document, Schema, Types } from "mongoose"

export interface IBlogCategory extends Document {
  name: string;
}

const categorySchema = new Schema<IBlogCategory>({
    name: {
        type: String,
        required: true,
        trim: true,

    },
},
    {timestamps: true}

)

const BlogCategory = mongoose.model<IBlogCategory>("Category", categorySchema);
export default BlogCategory;