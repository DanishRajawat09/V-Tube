import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { uploadOnCloud } from "../utils/cloudinary.js";

const getVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const sortTypes = parseInt(sortType);
  const pageNum = Number(page);
  const limitNum = Number(limit);
  const pipeline = [];

  pipeline.push({
    $sort: {
      [sortBy === "" ? "title" : sortBy]: isNaN(sortTypes) ? 1 : sortTypes,
    },
  });

  pipeline.push({
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "videoOwner",
      pipeline: [
        {
          $project: {
            username: 1,
            fullname: 1,
            email: 1,
            avatar: 1,
          },
        },
      ],
    },
  });

  pipeline.push({ $unwind: "$videoOwner" });

  if (userId) {
    pipeline.push({
      $match: { "videoOwner._id": mongoose.Types.ObjectId(userId) },
    });
  }
  if (query) {
    pipeline.push({ $match: { title: { $regex: query, $options: "i" } } });
  }

  pipeline.push({ $skip: (pageNum - 1) * limitNum });

  pipeline.push({ $limit: limitNum });

  const allVideo = await Video.aggregate(pipeline);

  if (!allVideo) {
    throw new ApiError(500, "video not found");
  }

  if (allVideo.length === 0) {
    throw new ApiError(404, "No videos found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, allVideo, "fetched all videos successfully"));
});

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    throw new ApiError(400, "title is required");
  }

  const videoLocalPath = req.files?.video[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "video or thumbnail required");
  }
  const videoFile = await uploadOnCloud(videoLocalPath);
  const thumbnail = await uploadOnCloud(thumbnailLocalPath);

  if (!videoFile.url || !thumbnail.url) {
    throw new ApiError(500, "video or thubnail not uploaded properly");
  }

  const video = await Video.create({
    videofile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
    title: title,
    description: description !== "" ? description : "",
    duration: videoFile.duration ?? 0,
  });

  if (!video) {
    throw new ApiError(500, "mongodb video error");
  }

  res
    .status(201)
    .json(new ApiResponse(201, video, "video created successfully"));
});
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "video id not found");
  }

  if (!mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "Invalid video ID format");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(500, "video not found in database");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "fetched video by id successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
    throw new ApiError(400, "invalid video id");
  }

  const { title, description } = req.body;

  const thumbnailLocalPath = req?.file?.path;

  let thumbnail;

  const updateVal = {};

  if (thumbnailLocalPath) {
    thumbnail = await uploadOnCloud(thumbnailLocalPath);

    if (thumbnail.url) {
      updateVal.thumbnail = thumbnail.url;
    }
  }

  if (title) {
    updateVal.title = title;
  }
  if (description) {
    updateVal.description = description;
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    { $set: updateVal },
    { new: true }
  );

  if (!video) {
    throw new ApiError(500, "process failed while updating database");
  }

  res
    .status(200)
    .json(new ApiResponse(200, video, "video updated successfully"));
});

export { getVideos, publishVideo, getVideoById, updateVideo };
