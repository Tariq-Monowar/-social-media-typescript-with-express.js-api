import { UploadedFile } from "express-fileupload";
import cloudinary from "../config/cloudinary.config";

// Utility function to convert file to Base64
const fileToBase64 = (file: UploadedFile): string => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

// Utility function to upload a file to Cloudinary
const uploadToCloudinary = async (base64Data: string) => {
  return await cloudinary.uploader.upload(base64Data, {
    resource_type: "auto",
  });
};

// Utility function to remove a file from Cloudinary
export const removeFromCloudinary = async (url: string) => {
  const match = url.match(/\/v\d+\/([^\/\.]+)/);
  const publicId = match ? match[1] : null;

  if (publicId) {
    return await cloudinary.uploader.destroy(publicId);
  }
  return null;
};

export const uploadFile = async (file: UploadedFile, url: string) => {
  try {
    const base64Data = fileToBase64(file);
    const uploadResult = await uploadToCloudinary(base64Data);

    console.log("File uploaded successfully:", uploadResult);

    // Remove previous file if URL is provided
    if (url) {
      const removeResult = await removeFromCloudinary(url);
      if (removeResult) {
        console.log("Previous file removed successfully:", removeResult);
      }
    }

    return uploadResult.secure_url;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};




export const removeCloudinary = async (urls: string[]) => {
  urls.map(async (url) => {
    const match = url.match(/\/v\d+\/([^\/\.]+)/);
    const publicId = match ? match[1] : null;

    if (publicId) {
      return await cloudinary.uploader.destroy(publicId);
    }
    return null;
  });
};



export const uploadMultipleFiles = async (files: UploadedFile[]) => {
  const uploadPromises = files.map((file) => {
    const base64Data = fileToBase64(file);
    return uploadToCloudinary(base64Data);
  });

  const uploadResults = await Promise.all(uploadPromises);
  return uploadResults.map((result) => result.secure_url);
};
