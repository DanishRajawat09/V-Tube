import mongoose from "mongoose";
import {DB_NAME} from "../constants.js" 
import { MONGODB_URI } from "../../config/env.js";

const connectDB = async () => {
    try {
      const connectionInstance =   await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`)
      console.log(`\n Mongodb connected !! DB HOST ${connectionInstance.connection.host}`);


      
    } catch (error) {
        console.log("mongodb connection Failed" , error);
        console.log(MONGODB_URI);
        
        
        process.exit(1)
    }
}

export default connectDB