import mongoose from "mongoose";
import dotenv from "dotenv";
import { error } from "console";
dotenv.config();

const connectToDb = async (retries=5): Promise<void> => {
    while (retries--) {
        try {
            const mongoUrl = process.env.MONGO_URL;
            if (!mongoUrl) {
                throw new Error("MONGO_URL is not defined in .env file");
            }
            await mongoose.connect(mongoUrl)
            console.log("Connected to MongoDB");
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
            process.exit(1); // Exit the process with failure
        
        }
    }
    mongoose.connection.on("disconnected", (error) => {
        console.log("MongoDB disconnected", error);
    })
}

export {connectToDb}