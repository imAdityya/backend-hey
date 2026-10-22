import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) return null;

    //file going to upload
    const response = await cloudinary.uploader.upload(localFilePath, { resoure_type: "auto"})
    
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

const deleteCloudinaryFile = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Old file deleted successfully", result)
    return result;
  } catch (error) {
    throw new ApiError(500, error?.message || "Failed to delete file from cloudinary")
  }
}

export {uploadOnCloudinary, deleteCloudinaryFile}