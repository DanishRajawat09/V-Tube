import dotenv from "dotenv"

dotenv.config({path : "./.env"})


 export const {PORT , MONGODB_URI , CORS_ORIGIN , ACCESS_TOKEN_SECRET ,ACCESS_TOKEN_EXPIRY , REFRESH_TOKEN_SECRET ,REFRESH_TOKEN_EXPIRRY} = process.env