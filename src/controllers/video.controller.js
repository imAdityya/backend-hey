import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary, deleteCloudinaryVideo, deleteCloudinaryImage } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const uploadVideo = asyncHandler( async(req, res) =>{
  //video, title, description, isPublished
  const user = await User.findById(req.user?._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(400, "login to upload video")
  }
  const {title, description, isPublished} = req.body;

  
  if(!title || !description){
    throw new ApiError(400, "All fields are required")
  }

  // if(typeof isPublished !== "boolean"){
  //   throw new ApiError(400, "isPublished accepts only Boolean value")
  // }

  const videoLocalPath = req.files?.video[0].path;
  console.log(videoLocalPath)
  if(!videoLocalPath){
    throw new ApiError(404, "video path not found")
  }

  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  console.log(thumbnailLocalPath)
  if(!thumbnailLocalPath){
    throw new ApiError(404, "thumbnail path not found")
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  console.log(videoFile)
  if(!videoFile){
    throw new ApiError(500, "failed to upload video on cloudinary")
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  console.log(thumbnail)
  if(!thumbnail){
    throw new ApiError(500, "failed to upload thumbnail on cloudinary")
  }

  const video = await Video.create({
    title,
    description,
    thumbnail: thumbnail.url,
    thumbnailPublicId: thumbnail.public_id,
    videoFile: videoFile.url,
    videoPublicId: videoFile.public_id,
    isPublished,
    duration: videoFile.duration,
    owner: user
  })

  return res
  .status(200)
  .json( new ApiResponse(
    200,
    video,
    "Video uploaded successfully"
  ))
  
})

const deleteVideo = asyncHandler( async(req, res) => {
  //verify video owner = login user _id
  //publicId thumbnail videoFile
  const loggedinUser = req.user?._id;
  if(!loggedinUser){
    throw new ApiError(401, "login required")
  }
  const { videoId } = req.body;

  if(!videoId){
    throw new ApiError(400, "videoId is required")
  }
  
  const video = await Video.findById(videoId)
  if(!video){
    throw new ApiError(400, "video not found")
  }
  
   if(!video.owner._id.equals(req.user._id)){
     throw new ApiError(403, "Unauthorized access")
   }
  const deletedCloudinaryThumbnail = await deleteCloudinaryImage(video.thumbnailPublicId);
  
  const deletedCloudinaryVideo = await deleteCloudinaryVideo(video.videoPublicId);
  const deletedVideo = await Video.deleteOne({ _id: videoId });

  if(!deletedVideo){
    throw new ApiError(400, "unable to delete video")
  }

  return  res
  .status(200)
  .json(
    new ApiResponse(
      200,
      deletedVideo,
      "video deleted successfully"
    )
  )
})

const getAllVideos = async (req, res) => {
  try {
    // Get pagination parameters from the URL
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit) || 10)
    );

    // Calculate how many videos to skip
    const skip = (page - 1) * limit;

    // Fetch videos
    const videos = await Video.find()
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    // Count total videos
    const totalVideos = await Video.countDocuments();

    // Calculate total pages
    const totalPages = Math.ceil(totalVideos / limit);
    //ceil roundup number

    const data = {
        videos,
        pagination: {
          currentPage: page,
          limit,
          totalVideos,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    return res.status(200).json(
      new ApiResponse(
        200,
        data,
        "video fetch successfully"
      )
    );
  } catch (error) {
    throw new ApiError(
      500,
      "failed to fetch video"
    )
  }
};

export {
  uploadVideo,
  deleteVideo,
  getAllVideos
}