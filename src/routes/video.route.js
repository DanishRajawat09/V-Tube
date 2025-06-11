import { Router } from "express";

const router = Router()

router.route("/get-videos").get((req , res) => res.send({message : "danish"}))


export default router