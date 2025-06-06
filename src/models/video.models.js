import mongoose from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"
const videoSchema = new mongoose.Schema({
   videofile : {
    type : String, // cloudinary URL
    required : true
   } ,
   thumbnail : {
    type : String,// cloudinary URL
    required : true
   },
   owner : {
    type : mongoose.Schema.Types.ObjectId,
    ref : "User"
   },
   title : {
    type : String,
    required : true,
    trim : true,
    minLength : 4,
   },
   description : {
    type : String,
    trim : true,
   },
   duration : {
    type : Number, // from cloudinary 
  required : true
},
   views : {
    type : Number,
    default : 0
   },
   ispublished : {
    type : Boolean,
default : true
   }
} , {timestamps : true})


videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video" , videoSchema)