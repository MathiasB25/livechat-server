import mongoose from "mongoose";

const chatSchema = mongoose.Schema({
    users: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }
    ],
    lastMessages: {
        from: {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User',
            default: null
        },
        messages: [
            {
                type: mongoose.SchemaTypes.ObjectId,
                ref: 'ChatMessage',
            }
        ],
    },
    chatType: {
        type: String,
        enum: ['md', 'group'],
        default: 'md'
    }
}, {
    timestamps: true
})

const Chat = mongoose.model("Chat", chatSchema)

export default Chat