import mongoose from "mongoose";

const friendRequestSchema = mongoose.Schema({
    from: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    to: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
})

const FriendRequest = mongoose.model("FriendRequest", friendRequestSchema)

export default FriendRequest