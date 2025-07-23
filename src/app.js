import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { CORS_ORIGIN } from "../config/env.js"

const app = express()

app.use(cors({
    origin : CORS_ORIGIN,
    credentials : true,
}))
app.use(express.json({limit : "16kb"}))
app.use(express.urlencoded({extended : true , limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

// import router
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.route.js"
app.use("/api/v1/users" , userRouter)
app.use("/api/v1/video" , videoRouter)
app.use("/api/v1/play-list")
export {app}