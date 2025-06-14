import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import {
  CLOUDINARY_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} from "../../config/env.js";

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const uploadOnCloud = async (localFilePath) => {
  try {
    if (!localFilePath) {
      return null;
    }
    const res = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("file is uploaded on cloudinary", res.url);
 fs.unlinkSync(localFilePath);
    return res;
  } catch (error) {
    fs.unlinkSync(localFilePath);

    return null;
  }
};
const deleteAssetOnCloudinary = async (filepath) => {
    try {
        if (!filepath) {
            return null
        }

      return await cloudinary.uploader.destroy(filepath)

        
    } catch (error) {
        console.log(error);
        
    }
}


export {deleteAssetOnCloudinary , uploadOnCloud}