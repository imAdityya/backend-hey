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
  let {title, description, isPublished} = req.body;

  
  if(!title || !description){
    throw new ApiError(400, "All fields are required")
  }

  if (typeof isPublished === "string") {
  if (isPublished !== "true" && isPublished !== "false") {
    throw new ApiError(400, "isPublished must be true or false");
  }

  isPublished = isPublished === "true";
}

if (typeof isPublished !== "boolean") {
  throw new ApiError(400, "isPublished accepts only Boolean value");
}
  const videoLocalPath = req.files?.video[0].path;

  if(!videoLocalPath){
    throw new ApiError(404, "video path not found")
  }

  const thumbnailLocalPath = req.files?.thumbnail[0].path;
  if(!thumbnailLocalPath){
    throw new ApiError(404, "thumbnail path not found")
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  
  if(!videoFile){
    throw new ApiError(500, "failed to upload video on cloudinary")
  }

  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

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


const getAllVideos = asyncHandler( async(req, res)  => {
  
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(
    50,
    Math.max(1, req.query.limit || 10)
  )

  const skip = (page - 1) * limit;

  const videos = await Video.find()
  .sort({ createdAt: -1, _id: -1})
  .skip(skip)
  .limit(limit)

  const totalVideos = await Video.countDocuments();

  const totalPages = Math.ceil(totalVideos / limit)

  const data = {
    videos,
    pagination: {
      currentPage: page,
      limit,
      totalPages,
      totalVideos,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      data,
      "videos fetched successfully"
    )
  )
})

const getVideoById = asyncHandler( async(req, res) => {

  //return video 
  
  const { videoId } = req.params;

  const video = await Video.findById(videoId);
  
  if(!video){
    throw new ApiError(404, "video not found, please provide valid videoId")
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      video,
      "video found successfully"
    )
  )
})

const updateVideoDetails = asyncHandler( async(req, res) => {
  // update video's title description isPublished thumbnail

  const { videoId } = req.params;

  const video = await Video.findById(videoId);
 
  if(!video){
    throw new ApiError(404, "video not found, please provide valid videoId")
  }

  if(!video.owner._id.equals(req.user._id)){
    throw new ApiError(401, "you are not the owner of the video")
  }
  
  let { title, description, isPublished } = req.body;
  
  if(!title && !description && !isPublished && !req.file){
    throw new ApiError(400, "please provide at least one detail to update")
  }

  if (typeof isPublished === "string") {
  if (isPublished !== "true" && isPublished !== "false") {
    throw new ApiError(400, "isPublished must be true or false");
  }

  isPublished = isPublished === "true";
}

  if (typeof isPublished !== "boolean") {
  throw new ApiError(400, "isPublished accepts only Boolean value");
}

  // let updatedDetails = [];
  
  if(title){
    video.title = title
  }

  if(description){
    video.description = description;
  }

  if(isPublished){
    video.isPublished = isPublished
  }

  if(req.file){  
    const thumbnailLocalPath = req.file.path;
    if(!thumbnailLocalPath){
    throw new ApiError(404, "thumbnail path not found")
    }
  
    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    if(!newThumbnail){
      throw new ApiError(500, "failed to upload thumbnail on cloudinary")
    }

    if(video.thumbnailPublicId){
      await deleteCloudinaryImage(video.thumbnailPublicId);
      console.log("Old thumbnail image deleted successfully")
    }
    video.thumbnail = newThumbnail.url;
    video.thumbnailPublicId = newThumbnail.public_id;
}  

  await video.save();
  
  return res.status(200)
  .json(
    new ApiResponse(
      200,
      video,
      "video updated successfully"
    )
  )
})

const togglePublishStatus = asyncHandler( async(req, res) => {
  //req.body input Publish Status
  //req.params videoId

  const { videoId } = req.params;

  const  video = await Video.findById(videoId);

  if(!video.owner._id.equals(req.user._id)){
    throw new ApiError(401, "Unauthorized access")
  }

  let { isPublished } = req.body;
  

  if(typeof isPublished !== "string" && typeof isPublished !== "boolean"){
    throw new ApiError(400, "provide isPublished")
  }
  
  if(isPublished !== "true" && isPublished !== "false" && isPublished !== true && isPublished !== false){
      throw new ApiError(400, "isPublished must be true or false")
    }

  const publishStatus = isPublished === true || isPublished === "true";

  video.isPublished = publishStatus

  await video.save()

  return res.status(200)
  .json( new ApiResponse(
    200,
    video,
    "publish status changed successfully"
  ))
})
export {
  uploadVideo,
  deleteVideo,
  getAllVideos,
  getVideoById,
  updateVideoDetails,
  togglePublishStatus
}