import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";

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
      localField: "Owner",
      foreignField: "_id",
      as: "videoOwner",
      pipeline : [
        {
            $project: {
                username : 1,
                fullname : 1,
                email : 1,
                avatar : 1,
            }
        }
      ]
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
    throw new ApiError(500 , "video not found" )
  }

  res.status(200).json(
    new ApiResponse(200 , allVideo , "fetched all videos successfully")
  )

});


export {getVideos}