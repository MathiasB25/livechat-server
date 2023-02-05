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
    reply: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'ChatMessage'
    },
    message: {
        type: String
    },
    edited: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
})

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema)

export default ChatMessage