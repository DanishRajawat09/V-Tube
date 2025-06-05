import dotenv from "dotenv"

dotenv.config({path : "./.env"})


 export const {PORT , MONGODB_URI , CORS_ORIGIN} = process.env