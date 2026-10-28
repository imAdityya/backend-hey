import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { Comment } from '../models/comment.model.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from '../models/user.model.js';

const getVideoComments = asyncHandler( async(req, res) => {
  
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if(!video){
    throw new ApiError(400, "Invalid videoId")
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))

  const skip = (page - 1) * limit;

  const comments = await Comment.find({ video: video })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)

const totalVideoComments = await Comment.countDocuments({ video: video });

const totalPages = Math.ceil(totalVideoComments / limit);

const data  = {
  comments,
  pagination: {
    currentPage: page,
    limit,
    totalPages,
    totalVideoComments,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1
  }
}

return res.status(200)
.json( new ApiResponse(
  200,
  data,
  `All comments of ${videoId} found successfully`
  ))
})
const addComment = asyncHandler( async(req, res) => {
  //videoId, content, user

  const { videoId } = req.params;

  
  const video = await Video.findById(videoId);

  if(!video){
    throw new ApiError(400, "Invalid videoId")
  }

  const user = await User.findById(req.user._id);

  if(!user){
    throw new ApiError(401, "Invalid user login to comment")
  }
  
  const { content } = req.body;

  const comment = await Comment.create({
    content: content,
    video: video,
    commentBy: user
  })

  return res.status(200)
  .json( new ApiResponse(
    200,
    comment,
    "comment added successfully"
  ))
  
})

const updateComment = asyncHandler( async(req, res) => {
  //loggedinUser = comment.commentBy
  //commentId params, content body

  const { commentId } = req.params;
  
  const comment = await Comment.findById(commentId);

  if(!comment){
    throw new ApiError(400, "comment not found please provide valid commentId")
  }

  if(!comment.commentBy._id.equals(req.user._id)){
    throw new ApiError(401, "you are not the owner of the comment")
  }

  const { content } = req.body;
  
  comment.content = content;
  await comment.save();

  return  res.status(200)
  .json( new ApiResponse(
    200,
    comment,
    "comment updated successfully"
  ))
})

const deleteComment = asyncHandler( async(req, res) => {

  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if(!comment){
    throw new ApiError(400, "comment not found please provide valid commentId")
  }

  if(!comment.commentBy._id.equals(req.user._id)){
    throw new ApiError(401, "you are not the owner of the comment")
  }

  const deletedComment = await Comment.deleteOne({ _id: commentId })

  return res.status(200)
  .json( new ApiResponse(
    200,
    deletedComment,
    "comment deleted successfully"
  ))
  
})

export { addComment,
       updateComment,
       deleteComment,
       getVideoComments
       }