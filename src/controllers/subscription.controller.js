import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { ApiResponse } from "../utils/ApiResponse.js";
import { Subscription } from '../models/subscription.model.js';

const toggleSubscription = asyncHandler( async(req, res) => {
  const { channelId } = req.params;

  const channel = await User.findById(channelId).select("-password -refreshToken -watchHistory");

  if(!channel){
    throw new ApiError(401, "unable to find channel provide valid channelId")
  }

  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "login to subscribe a channel")
  }

  const existedSubscriber = await Subscription.findOne({
    subscriber: user._id,
    channel: channel._id
  })

  if(existedSubscriber){
    const removeSubscriber = await Subscription.findOneAndDelete(existedSubscriber._id)

    return res.status(200)
    .json( new ApiResponse(
      200,
      removeSubscriber,
      "channel unsubscribed successfully"
    ))
  }

  const subscriber = await Subscription.create({
    subscriber: user,
    channel: channel
  })

  return res.status(200)
  .json( new ApiResponse(
    200,
    subscriber,
    "channel subscribe successfully"
  ))
})

const channelSubscribers = asyncHandler( async(req, res) => {

  const { channelId } = req.params;

  const channel = await User.findById(channelId).select("-password -refreshToken -watchHistory");

  if(!channel){
    throw new ApiError(401, "unable to find channel provide valid channelId")
  }

  const subscribers = await Subscription.countDocuments({
    channel: channel._id
  })

  return res.status(200)
  .json( new ApiResponse(
    200,
    subscribers,
    "subscribers found successfully"
  ))
})

const userSubscriptions = asyncHandler( async(req, res) => {

  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "login to check your subscription")
  }
  
  const subscription = await Subscription.countDocuments({
    subscriber: user._id
  })

  return res.status(200)
  .json( new ApiResponse(
    200,
    subscription,
    "subscription found successfully"
  ))
})

export { toggleSubscription, channelSubscribers, userSubscriptions }