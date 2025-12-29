import mongoose, { Document, Schema, Types } from "mongoose"

export interface IAuthor extends Document {
  first_name: string;
  surname: string;
  email: string;
  password: string;
  image?: string;
    role: "admin" | "author" | "user";
 
}

const authorSchema = new Schema<IAuthor>({
    first_name: {
        type: String,
        required: true,
        trim: true,

    },
    surname: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    image: {
        type: String,
        required: false,
    },
    password: {
        type: String,
        required: true,
        trim: true,
    },
    role: {
        type: String,
        enum: ["admin", "author", "user"],
        default: "user",
    }
},
    {timestamps: true}

)

const Author =mongoose.model<IAuthor>("Author", authorSchema);
export default Author;