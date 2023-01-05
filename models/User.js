import mongoose from "mongoose";
import bcrypt from 'bcrypt'

const userSchema = mongoose.Schema({
    username: {
        type: String,
        required: true,
        trim: true
    },
    tag: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        trim: true
    },
    profilePhoto: {
        type: String,
        default: null
    },
    bannerColor: {
        type: String,
        default: '#D4D4D8'
    },
    friends: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }
    ],
    blocked_friends: [
        {
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }
    ],
    status: {
        type: String,
        enum: ['online', 'away', 'occupied', 'invisible', 'offline'],
        default: 'offline'
    },
    token: {
        type: String,
    },
    confirmed: {
        type: Boolean,
        default: false
    },
    username_lowercase: {
        type: String,
        required: true,
        trim: true
    },
}, {
    timestamps: true
})

userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) {
        next()
    }
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
})

userSchema.methods.checkPassword = async function(formPassword) {
    return await bcrypt.compare(formPassword, this.password)
}

const User = mongoose.model("User", userSchema)

export default User