import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getVideos, publishVideo } from "../controllers/videos.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
const router = Router()

router.route("/").get(verifyJwt , getVideos)

router.route("/").post(verifyJwt ,  
    upload.fields([
        {
            name : "video",
            maxCount : 1
        },{
            name : "thumbnail",
            maxCount : 1
        }
    ]), publishVideo)

export default router