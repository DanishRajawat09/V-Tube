import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, password, email } = req.body;

  if (
    [fullname, email, username, password].some((data) => data?.trim() === "")
  ) {
    throw new ApiError(409, "plz fill all fields");
  }

  const exsistingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (exsistingUser) {
    throw new ApiError(500, "user is already exsisted");
  }

  const avatarLocalPath = req?.files?.avatar[0].path;
  // const coverImageLocalPath = req?.files?.coverImage[0]?.path

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(409, "avatar image is required");
  }
  const avatar = await uploadOnCloud(avatarLocalPath);
  const coverImage = await uploadOnCloud(coverImageLocalPath);

  console.log("upload done ");

  const newUser = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    avatar: avatar.url,
    coverimage: coverImage?.url || "",
    password,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshtoken"
  );

  if (!createdUser) {
    throw new ApiError(500, "user cant be created");
  }

  if (createdUser) {
    res.status(201).json(new ApiResponse(201, createdUser));
  }
});

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshtoken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access and refresh token"
    );
  }
};

const loginUser = asyncHandler(async (req, res) => {

  
  const { email , username,   password } = req.body;

  if (!(email || username)) {
    throw new ApiError(406, "email or username is required");
  }

  const exsistingUser = await User.findOne({ $or: [{ email }, { username }] });

  if (!exsistingUser) {
    throw new ApiError(400, "User not found plz register first");
  }

  if (!password) {
    throw new ApiError(406, "password is required");
  }

  const isPasswordValid = await exsistingUser.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(400, "password is not valid Enter a valid password");
  }

 const {accessToken , refreshToken} = await generateAccessAndRefreshToken(exsistingUser._id)

const loggedInUser = await User.findById(exsistingUser._id).select("-password -refreshtoken")

const options = {
  httpOnly : true,
  secure : false
}
res
  .status(200)
  .cookie("accesstoken", accessToken, options)
  .cookie("refreshtoken", refreshToken, options)
  .json(
    new ApiResponse(200, {
      user: loggedInUser,
      accessToken,
      refreshToken,
    }, "User logged in successfully")
  );


});


const logOutUser = asyncHandler(async (req, res) => {
   const userId = req.user._id

   User.findByIdAndUpdate({userId}  , {
    $set : {refreshtoken : undefined}
   },
  
  {
    new : true // we write this cause we need new updated user 
  })
const options = {
  httpOnly : true,
  secure : true
}
  
return res.status(200).clearCookie("accesstoken" , options).clearCookie("refreshtoken" , options).json(
  new ApiResponse(200 , {} , "user log")
)
})

const refreshAccessToken = asyncHandler(async(req, res) => { 
 const incomingRefreshToken = req.cookies.refreshtoken || req.body.refreshtoken

 if (!incomingRefreshToken) {
  throw new ApiError(401 , "Unauthorized request")
 }

 const decodedToken = jwt.verify(incomingRefreshToken , REFRESH_TOKEN_SECRET)
 
 const user = await User.findById(decodedToken._id)

 if (!user) {
  throw new ApiError(401 , "Unauthorized request")
 }
if (incomingRefreshToken !== user?.refreshtoken) {
    throw new ApiError(401 , "Unauthorized request invalid refresh Tokn")
}

const options = {
  httpOnly : true,
  secured : false
}

 const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id)

  return res.status(200).cookie("accesstoken" , accessToken.options).cookie("refreshtoken" , refreshToken , options).json(
    new ApiResponse(
      200 ,
      {
        accessToken , refreshToken
      },
      "access token refrsh successfully"
    )
  )
})
export { registerUser, loginUser,logOutUser  , refreshAccessToken};