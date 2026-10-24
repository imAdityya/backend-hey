import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {ApiError} from "./ApiError.js"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null;

    //file going to upload
    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: "auto",})
    
    //file uploaded successfully
    //console.log("File successfully uploaded on Cloudinary", response.url)

    fs.unlinkSync(localFilePath)
    //console.log("Response Cloudinary: ",response)
    return response
  } catch (error) {
      fs.unlinkSync(localFilePath) //remove the locally saved temporary file as the upload operation got failed
      console.log("File failed to upload on Cloudinary!!", error)
      return null
  }
}

const deleteCloudinaryImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {resource_type: "image"});
    console.log("Old file deleted successfully", result)
    return result;
  } catch (error) {
    throw new ApiError(500, error?.message || "Failed to delete file from cloudinary")
  }
}

const deleteCloudinaryVideo = async (publicId) => {
  try {
    if (!publicId) return null;

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: "video",
    });

    console.log("Cloudinary deletion response:", response);

    return response;
  } catch (error) {
     throw new ApiError(500, error?.message || "Failed to delete file from cloudinary")
  }
};

export {
  uploadOnCloudinary,
  deleteCloudinaryImage,
  deleteCloudinaryVideo
}