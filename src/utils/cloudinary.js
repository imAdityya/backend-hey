import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (locatFilePath) => {
  try {
    if(!locatFilePath) return null;

    //file going to upload
    const response = await cloudinary.v2.uploader.upload(locatFilePath, { resoure_type: "auto"})
    
    //file uploaded successfully
    console.log("File successfully uploaded on Cloudinary", response.url)

    return response
  } catch (error) {
      fs.unlinkSync(localStorage) //remove the locally saved temporary file as the upload operation got failed
      console.log("File failed to upload on Cloudinary!!", error)
      return null
  }
}

export {uploadOnCloudinary}