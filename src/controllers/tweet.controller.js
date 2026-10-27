import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Tweet } from '../models/tweet.model.js';
import { ApiResponse } from "../utils/ApiResponse.js";

const getTweets = asyncHandler( async(req, res) => {

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit) || 10)
  );
  const skip = (page - 1) * limit;

  const tweets = await Tweet.find()
  .sort({ createdAt: -1, _id: -1 })
  .skip(skip)
  .limit(limit)

  const totalTweets = await Tweet.countDocuments();

  const totalPages = Math.ceil(totalTweets / limit);

  const data = {
    tweets,
    pagination: {
      currentPage: page,
      totalPages: totalPages,
      limit: limit,
      totalTweets: totalTweets,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    }
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      data,
      "tweets fetched successfully"
    )
  )
})

const getUserTweets = asyncHandler( async(req, res) => {

  const { userId } = req.params;

  const user = await User.findById(userId);
  if(!user){
    throw new ApiError(400, "provide valid userId")
  }

  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(
    50,
    Math.max(1, parseInt(req.query.limit) || 10)
  )

  const skip = (page - 1) * limit;

  const tweets = await Tweet.find({ owner: user })
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)

  const totalUserTweets = await Tweet.countDocuments({ owner: user })

  const totalPages = Math.ceil(totalUserTweets / limit);

  const data = {
    tweets,
    pagination: {
      limit: limit,
      currentPage: page,
      totalPages: totalPages,
      totalUserTweets: totalUserTweets,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 
    }
  }

  return res.status(200)
  .json(
    new ApiResponse(
      200,
      data,
      "All user's tweet found successfully"
    )
  )
})

const createTweet = asyncHandler( async(req, res) => {
  //user login
  //content for tweet

  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "login to create tweet")
  }

  const { content } = req.body;

  if(!content){
    throw new ApiError(400, "content must be required")
  }

  const tweet = await Tweet.create({
    content: content,
    owner: user
  })

  return res.status(200)
  .json( new ApiResponse(
    200,
    tweet,
    "tweet created successfully"
  ))
})

const updateTweet = asyncHandler( async(req, res) => {

  //const user = await User.findById(req.user._id);

  const { tweetId }= req.params;

  if(!tweetId){
    throw new ApiError(400, "provide tweetId for update")
  }

  const tweet = await Tweet.findById(tweetId);

  if(!tweet){
    throw new ApiError(400, "provide valid tweetId")
  }

  if(!tweet.owner._id.equals(req.user._id)){
    throw new ApiError(401, "You don't have access to update this tweet")
  }

  const { content } = req.body;

  if(!content){
    throw new ApiError(400, "provide something to edit")
  }

  tweet.content = content;
  tweet.save();

  return res.status(200)
  .json( new ApiResponse(
    200,
    tweet,
    "tweet updated successfully"
  ))
  
})

const deleteTweet = asyncHandler( async(req, res) => {

  const { tweetId }= req.params;

  if(!tweetId){
    throw new ApiError(400, "provide tweetId for update")
  }

  const tweet = await Tweet.findById(tweetId);

  if(!tweet){
    throw new ApiError(400, "provide valid tweetId")
  }

  if(!tweet.owner._id.equals(req.user._id)){
    throw new ApiError(401, "You don't have access to update this tweet")
  }

  const deletedTweet = await Tweet.deleteOne({ _id: tweetId});

  return res.status(200)
  .json( new ApiResponse(
    200,
    deletedTweet,
    "tweet deleted successfully"
  ))
})

export { createTweet, updateTweet, deleteTweet, getUserTweets, getTweets }