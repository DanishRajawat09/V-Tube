import mongoose from "mongoose";

const playListSchema =  new mongoose.Schema({
    name : {
        type : String,
        required : true,
        trim : true,
        minLength : 3,
        unique : true,
    },
    description : {
        type : String,
        minLength : 4,
        trim : true
    },
    videos : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Video"
        }
    ],
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true})

export const Playlist = mongoose.model("Playlist" , playListSchema)