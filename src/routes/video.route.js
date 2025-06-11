import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getVideos } from "../controllers/videos.controller.js";
const router = Router()

router.route("/get-videos").get(verifyJwt , getVideos)



export default router