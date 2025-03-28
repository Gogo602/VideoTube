import mongoose, { Schema } from "mongoose";

const likeSchema = new Schema(
    {
        //either of 'videos', 'comments', or 'tweet' will be assigned others are null
        video: {
            type: Schema.Types.ObjectId,
            ref: "Videos",
        },
        comment: {
            type: Schema.Types.ObjectId,
            ref: "Comment",
        },
        tweet: {
            type: Schema.Types.ObjectId,
            ref: "Tweet",
        },
        likedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {timestamps: true}
)





export const Like = mongoose.model("Like", likeSchema)