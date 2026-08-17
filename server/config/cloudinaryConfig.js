import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET,
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads a file buffer to Cloudinary with automatic optimization / compression.
 * If Cloudinary is not configured in .env, falls back to a base64 Data URI for seamless local testing.
 *
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {string} originalname - Original file name
 * @param {string} folder - Destination folder on Cloudinary
 * @returns {Promise<{fileUrl: string, filePublicId: string, fileName: string}>}
 */
export const uploadCertificateImage = (
  buffer,
  originalname = "certificate",
  folder = "employee_certifications",
) => {
  return new Promise((resolve, reject) => {
    if (!isConfigured) {
      // Fallback for dev without Cloudinary credentials
      const mime = originalname.toLowerCase().endsWith(".pdf")
        ? "application/pdf"
        : originalname.toLowerCase().endsWith(".png")
          ? "image/png"
          : "image/jpeg";
      const base64Data = `data:${mime};base64,${buffer.toString("base64")}`;
      return resolve({
        fileUrl: base64Data,
        filePublicId: `local_${Date.now()}`,
        fileName: originalname,
      });
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "auto",
        transformation: [{ quality: "auto:good", fetch_format: "auto" }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          fileUrl: result.secure_url,
          filePublicId: result.public_id,
          fileName: originalname,
        });
      },
    );

    uploadStream.end(buffer);
  });
};

export default cloudinary;
