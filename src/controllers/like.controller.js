import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { Comment } from '../models/comment.model.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { User } from '../models/user.model.js';
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";

const getLikedVideos = asyncHandler( async(req, res) => {

  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "user not found")
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);

  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit) || 10)
  )

  const skip = (page - 1) * limit;

   const likedVideo = await Like.find({
    likedBy: user._id,
    video: { $exists: true, $ne: null }
  }).sort({})

  const totalLikedVideo = await Like.countDocuments({ likedBy: user._id, video: { $exists: true, $ne: null } }).select("video")

  const totalPages = Math.ceil(totalLikedVideo / limit);
  
  const data = {
    likedVideo,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      totalLikedVideo: totalLikedVideo,
      limit: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      data,
      "user's liked video fetched successfully"
    )
  )
})

const toggleVideoLike = asyncHandler( async(req, res) => {

  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if(!video){
    throw new ApiError(400, "provide valid videoId")
  }

  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "user not found")
  }

  const likeExist = await Like.findOne({
    video: video._id,
    likedBy: user._id
  })

  if(likeExist){
    await Like.findOneAndDelete(likeExist._id)

    return res.status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "like remove from video"
      )
    )
  }

  const like = await Like.create({
    video: video,
    likedBy: user
  })

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      like,
      "video like successfully"
    )
  )
});

const toggleCommentLike = asyncHandler( async(req, res) => {

  const { commentId } = req.params;

  const comment = await Comment.findById(commentId);

  if(!comment){
    throw new ApiError(400, "provide valid commentId")
  }

  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "user not found")
  }

  const likeExist = await Like.findOne({
    comment: comment._id,
    likedBy: user._id
  })

  if(likeExist){
    await Like.findOneAndDelete(likeExist._id)

    return res.status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "like remove from comment"
      )
    )
  }

  const like = await Like.create({
    comment: comment,
    likedBy: user
  })

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      comment,
      "comment like successfully"
    )
  )
})

const toggleTweetLike = asyncHandler( async(req, res) => {

  const { tweetId } = req.params;

  const tweet = await Tweet.findById(tweetId);

  if(!tweet){
    throw new ApiError(400, "provide valid tweetId")
  }

  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "user not found")
  }

  const likeExist = await Like.findOne({
    tweet: tweet._id,
    likedBy: user._id
  })

  if(likeExist){
    await Like.findOneAndDelete(likeExist._id)

    return res.status(200)
    .json(
      new ApiResponse(
        200,
        {},
        "like remove from tweet"
      )
    )
  }

  const like = await Like.create({
    tweet: tweet,
    likedBy: user
  })

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      like,
      "tweet like successfully"
    )
  )
})

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos }