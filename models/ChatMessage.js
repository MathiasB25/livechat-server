import mongoose from "mongoose";

const chatMessageSchema = mongoose.Schema({
    chatId: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'Chat'
    },
    from: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User'
    },
    message: {
        type: String
    }
}, {
    timestamps: true
})

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema)

export default ChatMessage