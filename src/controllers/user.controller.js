import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary, deleteCloudinaryImage } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    await user.save({validateBeforeSave: false})
    return {accessToken, refreshToken}
    
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

const options = {
    httpOnly: true,
    secure: true
  };

const registerUser = asyncHandler( async (req, res) => {
  //get details from frontend
  //chehck valition - null, unformatted values
  //check user already exist - email, username
  //check image uploaded, check for avatar
  //check image uploaded on cloudinary
  //get cloudinary res url
  //create user object - user entry in db
  //response remove password and refresh token
  //check for user creation
  //return res

  const {fullName, email, username, password} = req.body
  //console.log("email :", email);
  //console.log("req.body: ", req.body)
  
  if(
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ){
    throw new ApiError(400, "All fields required")
  }
  const existedUser = await User.findOne({
    $or: [{ email },{ username }]
  })

  if(existedUser){
    throw new ApiError(409, "User already exist!")
  }

  //console.log("files: ",req.files)

  const avatarLocalPath = await req.files?.avatar[0]?.path;
  //const coverImageLocalPath = await req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar Image required!")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath)
  //console.log(avatar)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar Image required!")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    avatarPublicId: avatar.public_id,
    coverImage: coverImage?.url || "",
    coverImagePublicId: coverImage?.display_name,
    email,
    username: username.toLowerCase(),
    password,
  })

  const userCreated = await User.findById(user._id).select("-password -refreshToken -watchHistory")

  if(!userCreated){
    throw new ApiError(500, "Failed to create user in db")
  }

  return res.status(201).json(
    new ApiResponse(200, userCreated, "User Registered Successfully!!")
  )
  
  })

const loginUser = asyncHandler( async (req, res) => {
  //req body data
  //check value null or unformatted
  //search user via email/username db
  //password bcrypt auth
  //access & refresh token generate
  //send cookies
  //success response

  const {email, username, password} = req.body;

  if(!(username || email)){
    throw new ApiError(400, "email or username required to Login!")
  }

  if(!password){
    throw new ApiError(400, "password must be required to Login!")
  };

  const user = await User.findOne({
    $or: [{username}, {email}]
  });

  if(!user){
    throw new ApiError(404, "User is not registered!")
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if(!isPasswordValid){
    throw new ApiError(401, "wrong password!")
  }

  console.log(user._id)

  const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken -watchHistory");

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser, accessToken, refreshToken
        },
        "User Logged In Successfully!"
      )
    )
})

const logoutUser = asyncHandler( async (req, res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: { refreshToken: 1 }
      },
      {
        new: true
      }
    );


  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User LoggedOut Successfully!"))
  
})

const refreshAccessToken = asyncHandler( async(req, res) => {
  
  const incomingRefreshToken = req.cookies?.refreshToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if(!incomingRefreshToken){
    throw new ApiError(401, "Invalid Refresh Token!")
  };

  try {
    const decodeToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
    const user = await User.findById(decodeToken._id);
    
    if(!user){
      throw new ApiError(401, "Invalid Refresh Token!!")
    };
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh Token expire or used!")
    }
  
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
  
    return res
    .status(200)
    .cookie("accessToken", accessToken)
    .cookie("refreshToken", newRefreshToken)
    .json(
      new ApiResponse(
        201,
        {accessToken, refreshToken: newRefreshToken},
        "Access Token Refreshed!"
      )
    )
  } catch (error) {
    throw new ApiError(401, error?.message ||
                      "Something went wrong while generating refresh token!")
  }
})

const changeCurrentPassword = asyncHandler( async(req, res) => {
  const {oldPassword, newPassword} = req.body;

  const user = await User.findById(req.user?._id);

  const passwordVerified = await user.isPasswordCorrect(oldPassword);

  if(!passwordVerified){
    throw new ApiError(400, "Incorect Password!")
  }

  user.password = newPassword;
  await user.save({validateBeforeSave: false})

  return res.status(200).json(
    new ApiResponse(
      200,
      {},
      "New Password Updated Successfully!"
    ))
})

const currentUser = asyncHandler( async(req, res) => {
  return res.status(200).json( 
    new ApiResponse(
      200, 
      req.user, 
      "current user fetched successfully!"
    ))
})

const updateAccountDetails = asyncHandler( async(req, res) => {
  const {fullName, email} = req.body;

  if(!fullName || !email){
    throw new ApiError(400, "Provide user details to update")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email
      }
    },
    {new: true}
  ).select("-password -refreshToken -watchHistory")

  return res.status(200).json(new ApiResponse(
    200,
    user,
    "Details Updated Successfully!"
  ))
})

const updateUserAvatar = asyncHandler( async(req, res) => {
  const avatarLocalPath = req.file?.path;

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar must be required!")
  }
console.log(avatarLocalPath)
  const avatar = await uploadOnCloudinary(avatarLocalPath);

  if(!avatar.url){
    throw new ApiError(400, "Error while uploading avatar!")
  }

  const userOldAvatarPublicId = await User.findById(req.user?._id).select("avatarPublicId")
  await deleteCloudinaryImage(userOldAvatarPublicId)
  
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    {new: true}
  ).select("-password -refreshToken -watchHistory")

    //TODO: delete old image

  return res.status(200).json(new ApiResponse(
    200,
    user,
    "Avatar Updated Successfully"
  ))
})

const updateUserCoverImage = asyncHandler( async(req, res) => {
  const coverImageLocalPath = req.file?.path;

  if(!coverImageLocalPath){
    throw new ApiError(400, "Avatar must be required!")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading cover image")
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    {new: true}
  ).select("-password")

  //TODO: delete old image

  return res.status(200).json(new ApiResponse(
    200,
    user,
    "Cover Image Updated Successfully"
  ))
})

const getUserChannelProfile = asyncHandler( async(req, res) => {
  const {username} = req.params;

  if(!username?.trim()){
    throw new ApiError(400, "Username is missing")
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers"
        }},
    {$lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribeTo"
      }},
    {
      $addFields: {
        subscribersCount: {
              $size: "$subscribers"
              },
        channelsSubcriberToCount: {
            $size: "$subscribeTo"
          },
        isSubscribed: {
            $cond: {
              if : {$in: [req.user?._id, "$subscribers.subscriber"]},
              then: true,
              else: false
            }
          }
    },
  },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubcriberToCount: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
        createdAt: 1
      }
    }
  ])

console.log(channel)

  if(!channel?.length){
    throw new ApiError(404, "channel does not exists")
  }

  return res
.status(200)
.json(new ApiResponse(
  200,
  channel[0],
  "user channel fetched successfully"))
})

const getWatchHistory = asyncHandler( async(req, res) => {

  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0].watchHistory,
      "Watch History fetched successfully"
    )
  )
})

const deleteUser = asyncHandler( async(req, res) => {
  const user = req.user?._id;

  if(!user){
    throw new ApiError(404, "user not found")
  }

  const result = await User.deleteOne({ _id: user });

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      result,
      "user deleted successfully"
    )
  )
})

  export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  currentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
  deleteUser
}