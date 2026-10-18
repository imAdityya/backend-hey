import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from '../ApiError.js';
import { User } from '../models/user.models.js';
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";

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
  console.log("email :", email);
  console.log(req.body)
  
  if(
    [fullName, email, username, password].some((field) => field?.trim === "")
  ){
    throw new ApiError(400, "All fields required")
  }
  const existedUser = User.findOne({
    $or: [{ email },{ username }]
  })

  if(existedUser){
    throw new ApiError(409, "User already exist!")
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

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

export {registerUser}