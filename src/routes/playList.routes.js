import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware";
const router = Router()


router.route("/create").post(verifyJwt , createPlayList)




export default router