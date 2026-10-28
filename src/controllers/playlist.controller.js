import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { Playlist } from '../models/playlist.model.js';
import { Video } from '../models/video.model.js';
import { ApiResponse } from "../utils/ApiResponse.js";

const createPlaylist = asyncHandler( async(req, res) => {
  const { name, description } = req.body;
  if(!name || !description){
    throw new ApiError(400, "provide name & description to create playlist")
  }

  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "login to create playlist")
  }

  const playlist = await Playlist.create({
    name: name,
    description: description,
    owner: user
  })

  return res.status(200)
  .json( new ApiResponse(
    200,
    playlist,
    "playlist created successfully"
  ))
})

const addVideo = asyncHandler( async(req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "login to add video in playlist")
  }

  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findById(playlistId);

  if(!playlist){
    throw new ApiError(400, "playlist not found provide valid playlistId")
  }

  const video = await Video.findById(videoId);

  if(!video){
    throw new ApiError(400, "video not found provide valid videoId")
  }

  playlist.videos.push(videoId);

  await playlist.save();

  return res.status(200)
  .json( new ApiResponse(
    200,
    playlist,
    "video added to playlist successfully"
  ))
})

const removeVideo = asyncHandler( async(req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "login to add video in playlist")
  }

  const { playlistId, videoId } = req.params;

  const playlist = await Playlist.findOneAndUpdate(
    playlistId,
    {
      $pull: { videos: videoId }
    },
    { new: true }
  );

  if(!playlist){
    throw new ApiError(400, "playlist not found provide valid playlistId")
  }

  return res.status(200)
  .json( new ApiResponse(
    200,
    playlist,
    "video removed from playlist successfully"
  ))
})

const deletePlaylist = asyncHandler( async(req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId);

  if(!playlist){
    throw new ApiError(400, "playlist not found please provide valid playlistId")
  }

  if(!playlist.owner._id.equals(req.user._id)){
    throw new ApiError(401, "you are not the owner of the comment")
  }

  const deletedPlaylist = await Playlist.deleteOne({ _id: playlistId })

  return res.status(200)
  .json( new ApiResponse(
    200,
    deletedPlaylist,
    "playlist deleted successfully"
  ))
})

const updatePlaylist = asyncHandler( async(req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "login to add video in playlist")
  }

  const { playlistId } = req.params;

  const { name, description } = req.body;
  if(!name || !description){
    throw new ApiError(400, "provide name & description to update playlist")
  }

  const playlist = await Playlist.updateMany(
    { _id: playlistId },
    {
      $set: {
        name: name,
        description: description
      }
    },
    { new: true }
  )

  if(!playlist){
    throw new ApiError(400, "no any playlist found for update")
  }

  return res.status(200)
  .json( new ApiResponse(
    200,
    playlist,
    "playlist updated successfully"
  ))
})

const userPlaylists = asyncHandler( async(req, res) => {
  const user = await User.findById(req.user._id).select("-password -refreshToken -watchHistory");

  if(!user){
    throw new ApiError(401, "login to look your playlist")
  }

  const playlist = await Playlist.find({
    owner: user._id
  });

  if(!playlist){
    throw new ApiError(400, "no any playlist found")
  }

  return res.status(200)
  .json( new ApiResponse(
    200,
    playlist,
    "playlist found successfully"
  ))
})

const playlistById = asyncHandler( async(req, res) => {
  const { playlistId } = req.params;

  const playlist = await Playlist.findById(playlistId);

  if(!playlist){
    throw new ApiError(400, "playlist not found please provide valid playlistId")
  }

  return res.status(200)
  .json( new ApiResponse(
    200,
    playlist,
    "playlist found successfully"
  ))
})

export { createPlaylist, addVideo, removeVideo, deletePlaylist, updatePlaylist, userPlaylists, playlistById }