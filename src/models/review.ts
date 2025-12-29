import mongoose, { Document, Schema, Types } from "mongoose";
import Blog  from "./blog"; // Assuming the Blog model is in the same directory
export interface IReview extends Document {
    blog: Types.ObjectId;
    author?: Types.ObjectId;
    rating: number;
}

const reviewSchema = new Schema<IReview>({
    blog: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Blog",
        required: true,
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Author",
        required: false, // Optional field for author
        default: "anonymous"
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5, // Assuming a rating scale of 1 to 5
    },
})
// 🧠 Calculate average rating after a review is saved
reviewSchema.post<IReview>("save", async function () {
    const blogId = this.blog;
  
    // Fetch all reviews for this blog
    const reviews = await Review.find({ blog: blogId });
  
    const average =
      reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
  
    // Update the blog with the new average rating
    await Blog.findByIdAndUpdate(blogId, { averageRating: average });
  });
  
  const Review = mongoose.model<IReview>("Review", reviewSchema);
export default Review 