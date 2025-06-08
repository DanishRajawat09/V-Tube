import { ACCESS_TOKEN_SECRET } from "../../config/env.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
export const verifyJwt = asyncHandler(async(req, res , next) => { 



const token  = req.cookies?.accesstoken || req.header("Authorization")?.replace("Bearer " , "")

if (!token) {
    throw new ApiError(401 , "Unauthorized request")
}

  const decoded = jwt.verify(token , ACCESS_TOKEN_SECRET)

 const user =   await User.findById(decoded?._id).select("-password -refreshtoken")

 if (!user) {
    throw new ApiError(401 , "unauthorized")
 }

 req.user = user

 next()


})

