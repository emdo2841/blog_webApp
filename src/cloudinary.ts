import multer, { Multer } from "multer";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Multer middleware (temporary local storage)
const upload = multer({ storage: multer.memoryStorage() }); // fast

/**
 * Upload a file to Cloudinary
 * @param filePath - local file path
 * @returns Promise<string | null> - Cloudinary URL or null
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  filename: string
): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "products",
        public_id: filename.split(".")[0], // optional: clean filename
        fetch_format: "auto",
        quality: "auto",
        crop: "auto",
        gravity: "auto",
        width: 500,
        height: 500,
      },
      (error, result) => {
        if (error) {
          console.error("Cloudinary Upload Error:", error);
          return reject(null);
        }
        resolve(result?.secure_url || null);
      }
    );

    stream.end(fileBuffer);
  });
};

/**
 * Add new images to existing ones by uploading to Cloudinary
 * @param existingImages - array of image URLs already stored
 * @param files - array of Multer file objects
 * @returns Promise<string[]> - updated image URLs
 */export const addImages = async (
   existingImages: string[],
   files: Express.Multer.File[]
 ): Promise<string[]> => {
   const uploadedImages: string[] = [];

   for (const file of files) {
     const imageUrl = await uploadToCloudinary(file.buffer, file.originalname);
     if (imageUrl) {
       uploadedImages.push(imageUrl);
     }
   }

   return [...existingImages, ...uploadedImages];
 };

/**
 * Remove images from Cloudinary and return updated image list
 * @param existingImages - current image URLs
 * @param imagesToRemove - URLs to delete
 * @returns updatedImages and errors
 */
export const removeImages = async (
  existingImages: string[],
  imagesToRemove: string[]
): Promise<{ updatedImages: string[]; errors: string[] }> => {
  const updatedImages: string[] = [];
  const errors: string[] = [];

  for (const img of existingImages) {
    if (imagesToRemove.includes(img)) {
      const publicId = extractCloudinaryPublicId(img);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (error) {
          console.error("Cloudinary Deletion Error:", error);
          errors.push(`Failed to delete: ${img}`);
        }
      } else {
        errors.push(`Invalid Cloudinary URL: ${img}`);
      }
    } else {
      updatedImages.push(img);
    }
  }

  return { updatedImages, errors };
};

/**
 * Extract Cloudinary public ID from full URL
 * @param url - Cloudinary secure_url
 * @returns publicId string or null
 */
export const extractCloudinaryPublicId = (url: string): string | null => {
  if (!url) return null;

  try {
    const cleanUrl = url.split("?")[0];
    const parts = cleanUrl.split("/upload/");
    if (parts.length < 2) return null;

    const publicIdWithExtension = parts[1];
    const publicId = publicIdWithExtension.split(".").slice(0, -1).join(".");
    return publicId;
  } catch (error) {
    console.error("Failed to extract publicId:", error);
    return null;
  }
};

export { upload };
