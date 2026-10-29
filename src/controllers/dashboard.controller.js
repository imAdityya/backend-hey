import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Playlist } from '../models/playlist.model.js';
import { Video } from '../models/video.model.js';
import { Like } from "../models/like.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler( async(req, res) => {

  const { channelId } = req.params;

  const channel = await User.findById(channelId).select("-password -refreshToken -watchHistory");

  if(!channel){
    throw new ApiError(401, "unable to find channel provide valid channelId")
  }

  const subscribers = await Subscription.countDocuments({
    channel: channel._id
  })

  const likes = await Like.countDocuments({
   $or: [
     {
       "video.owner": channel._id,
       "comment.owner": channel._id,
       "tweet.owner": channel._id
     }
   ]
 })

  const result = await Video.aggregate([
    {
      $match: {
        owner: channel._id
      },
    },
    {
      $group: {
        _id: null,
        totalViews: 
        {$sum: "$views"}
      }
    }
  ])

  const videosViews = result[0]?.totalViews || 0;

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      { subscribers, likes, videosViews },
      "dashboard of channel found successfully"
    )
  )
  
})

const getChannelVideos = asyncHandler( async(req, res) => {

  const { channelId } = req.params;

  const channel = await User.findById(channelId).select("-password -refreshToken -watchHistory");

  if(!channel){
    throw new ApiError(401, "unable to find channel provide valid channelId")
  }
  
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10))

  const skip = (page - 1) * limit;
  
  const videos = await Video
    .find({ owner: channel._id })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)

  const totalVideos = await Video.countDocuments({ owner: channel._id })
  const totalPages = Math.ceil(totalVideos / limit);

  const videosData  = {
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
      videosData,
      "channel's videos found successfully"
    )
  )
})

export { getChannelStats, getChannelVideos }