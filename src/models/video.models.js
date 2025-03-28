import mongoose, { Schema } from "mongoose";


const videoSchema = new Schema({
    VideoFile: {
        type: String, //cloudinary url
        required: true,
    },
    thumnail: {
        type: String, //cloudinary url
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String, 
        required: true,
    },
    duration: {
        type: Number, 
        required: true,
    },
    views: {
        type: Number, 
        default: 0,
    },
    isPublished: {
        type: Bolean, 
        default: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: "User",
    }
}, {timestamps: true})


export const Video = mongoose.model("Video", videoSchema)