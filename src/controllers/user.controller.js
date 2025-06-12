import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { deleteAssetOnCloudinary, uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { REFRESH_TOKEN_SECRET } from "../../config/env.js";

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
    avatar: {
      url: avatar?.url,
      publicId: avatar?.public_id,
    },
    coverimage: {
      url: coverImage?.url || "",
      publicId: coverImage?.public_id || "",
    },
    password,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshtoken"
  );

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    newUser._id
  );

  if (!createdUser) {
    throw new ApiError(500, "user cant be created");
  }
  const options = {
    httpOnly: true,
    secure: false,
  };

  if (createdUser) {
    res
      .status(201)
      .cookie("accesstoken", accessToken, options)
      .cookie("refreshtoken", refreshToken, options)
      .json(new ApiResponse(201, createdUser));
  }
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

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

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    exsistingUser._id
  );

  const loggedInUser = await User.findById(exsistingUser._id).select(
    "-password -refreshtoken"
  );

  const options = {
    httpOnly: true,
    secure: false,
  };
  res
    .status(200)
    .cookie("accesstoken", accessToken, options)
    .cookie("refreshtoken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

const logOutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  User.findByIdAndUpdate(
    { userId },
    {
      $unset: { refreshtoken: 1 },
    },

    {
      new: true, // we write this cause we need new updated user
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshtoken", options)
    .json(new ApiResponse(200, {}, "user log out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshtoken || req.body.refreshtoken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(incomingRefreshToken, REFRESH_TOKEN_SECRET);

  const user = await User.findById(decodedToken._id);

  if (!user) {
    throw new ApiError(401, "Unauthorized request");
  }
  if (incomingRefreshToken !== user?.refreshtoken) {
    throw new ApiError(401, "Unauthorized request invalid refresh Tokn");
  }

  const options = {
    httpOnly: true,
    secured: false,
  };

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  return res
    .status(200)
    .cookie("accesstoken", accessToken, options)
    .cookie("refreshtoken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          accessToken,
          refreshToken,
        },
        "access token refrsh successfully"
      )
    );
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "incorrect password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully "));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname && !email) {
    throw new ApiResponse(400, "all field are required");
  }

  const data = {};

  if (fullname !== "") data.fullname = fullname;
  if (email !== "") data.email = email;

  if (Object.keys(data).length === 0)
    throw new ApiError(400, "all fields required");

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: data },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "account detaild updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  await deleteAssetOnCloudinary(req.user?.avatar?.publicId);

  const avatar = await uploadOnCloud(avatarLocalPath);

  if (!avatar.url) {
    throw new ApiError(500, "Error While Uploading on avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { avatar: { url: avatar.url, publicId: avatar.public_id } },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});
const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path;

  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage file is missing");
  }
  await deleteAssetOnCloudinary(req.user?.coverimage?.publicId);

  const coverImage = await uploadOnCloud(coverImageLocalPath);

  if (!coverImage.url) {
    throw new ApiError(500, "Error While Uploading on coverImage");
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverimage: { url: coverImage?.url, publicId: coverImage?.public_id },
      },
    },
    { new: true }
  ).select("-password");

  res
    .status(200)
    .json(new ApiResponse(200, user, "coverImage updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberscount: {
          $size: "$subscribers",
        },
        channelssubscribedtocount: {
          $size: "$subscribedTo",
        },
        issubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        username: 1,
        email: 1,
        subscriberscount: 1,
        channelssubscribedtocount: 1,
        issubscribed: 1,
        avatar: 1,
        coverimage: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exsist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchhistory",
        foreignField: "_id",
        as: "watchhistory",
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
                    fullanme: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].Watchhistory,
        "fetched watchHistory successfully "
      )
    );
});
export {
  registerUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  getCurrentUser,
  changeCurrentUserPassword,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
