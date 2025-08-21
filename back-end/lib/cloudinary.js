// lib/cloudinary.js

import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

/**
 * Upload an image buffer or file path to Cloudinary.
 * @param {Buffer|string} file - local path or buffer
 * @param {object} options - optional cloudinary options (e.g., folder, public_id)
 * @returns {Promise<object>} uploaded file details
 */
export async function uploadImage(file, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: "image",
      ...options,
    });
    return result;
  } catch (err) {
    console.error("Cloudinary upload failed:", err);
    throw new Error("Upload failed");
  }
}

/**
 * Delete an image by public_id.
 */
export async function deleteImage(publicId) {
  try {
    return await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete failed:", err);
    throw new Error("Delete failed");
  }
}

export default cloudinary;