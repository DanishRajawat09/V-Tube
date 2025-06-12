import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getVideoById,
  getVideos,
  publishVideo,
  togglePublish,
  updateVideo,
} from "../controllers/videos.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/").get(verifyJwt, getVideos);

router.route("/").post(
  verifyJwt,
  upload.fields([
    {
      name: "video",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  publishVideo
);

router.route("/:videoId").get(verifyJwt, getVideoById);
router
  .route("/update-video/:videoId")
  .patch(verifyJwt, upload.single("thumbnail"), updateVideo);

router.route("/delete-video/:videoId").delete(verifyJwt, deleteVideo);

router.route("/toggle/publish/:videoId").patch(verifyJwt , togglePublish)
export default router;
