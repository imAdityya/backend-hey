import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from "../utils/cloudinary.js";
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
    throw new ApiError(500, "Something went wrong while generating refesh and access token")
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
    [fullName, email, username, password].some((field) => field?.trim === "")
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
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){
    throw new ApiError(400, "Avatar Image required!")
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
    password,
  })

  const userCreated = await User.findById(user._id).select("-password -refreshToken")

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

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

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
        $set: { refreshToken: undefined }
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

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken
}