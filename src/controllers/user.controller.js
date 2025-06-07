import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.models.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
const registerUser = asyncHandler(async (req, res) => {
  const { fullname, username, password, email } = req.body;

  if (
    [fullname, email, username, password].some((data) => data?.trim() === "")
  ) {
    throw new ApiError(409, "plz fill all fields");
  }

  const exsistingUser = await User.findOne({
    $or: [{ fullname }, { email }],
  });

  if (exsistingUser) {
    throw new ApiError(500, "user is already exsisted");
  }

  const avatarLocalPath = req?.files?.avatar[0].path;
  const coverImageLocalPath = req?.files?.coverImage[0].path;

  if (!avatarLocalPath) {
    throw new ApiError(409, "avatar image is required");
  }
  const avatar = await uploadOnCloud(avatarLocalPath);
  const coverImage = await uploadOnCloud(coverImageLocalPath);

  const newUser = await User.create({
    fullname,
    username: username.toLowerCase(),
    email,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  const createdUser = await User.findById(newUser._id).select(
    "-password -refreshtoken"
  );

  if (createdUser) {
    throw new ApiResponse(201, createdUser, "userCreated successfully");
  }
});

export { registerUser };