import mongoose from "mongoose";
import User from "../models/User.js";
import Chat from "../models/Chat.js";
import ChatMessage from "../models/ChatMessage.js";

const ObjectId = mongoose.Types.ObjectId;

export const getChats = async (req, res) => {
    const user = req.user;

    try {
        const chats = await Chat.find({ users: user._id.toString() }).populate({ path: 'users', select: '_id username tag profilePhoto status bannerColor' }).select('-__v -createdAt -updatedAt');
        return res.json(chats);
    } catch (error) {
        const catchError = new Error('Algo salió mal');
        return res.status(404).json({ msg: catchError.message });
    }
}

export const getMessages = async (req, res) => {
    const user = req.params.user;

    if(!user) {
        const error = new Error('Algo salió mal');
        return res.status(404).json({ msg: error.message });
    }

    if(!ObjectId.isValid(user)) {
        const error = new Error('Usuario no válido');
        return res.status(404).json({ msg: error.message });
    }

    const userExists = await User.findById(user);
    if(!userExists) {
        const error = new Error('El usuario no existe');
        return res.status(404).json({ msg: error.message });
    }

    let isChatCreated = false;
    let chat = await Chat.findOne({ $or: [{ $and: [{ users: user }, { users: req.user._id.toString() }], $and: [{users: req.user._id.toString() }, { users: user }] }] }).populate({ path: 'users', select: 'username tag profilePhoto bannerColor status' }).select('-__v -createdAt -updatedAt')
    if(!chat && user !== req.user._id) {
        isChatCreated = true;
        chat = new Chat({ users: [ user, req.user._id ] })
        await chat.save();
    }

    if( chat.lastMessages.from && chat.lastMessages.from.toString() !== req.user._id.toString() ) {
        chat.lastMessages.from = null;
        chat.lastMessages.messages = [];
        chat.save();
    }

    try {
        const messages = await ChatMessage.find({ chatId: chat._id }).populate({ path: 'from', select: 'username tag profilePhoto bannerColor status' }).select('-__v -createdAt -chatId -_id');
        if(isChatCreated) {
            return res.json({ chat, messages });
        } else {
            return res.json({ chat: {}, messages });
        }
    } catch (error) {
        const catchError = new Error('Algo salió mal');
        return res.status(404).json({ msg: catchError.message });
    }
}

export const createMessage = async (req, res) => {
    const toChat = req.body.toChat;
    const message = req.body.message;
    
    if(!toChat) {
        const error = new Error('El mensaje debe ser enviado a alguien');
        return res.status(404).json({ msg: error.message });
    }

    if(!ObjectId.isValid(toChat)) {
        const error = new Error('Usuario no válido');
        return res.status(404).json({ msg: error.message });
    }

    const chat = await Chat.findById(toChat);
    if(!chat) {
        const error = new Error('Algo salió mal');
        return res.status(404).json({ msg: error.message });
    }
    
    const newMessage = new ChatMessage({ chatId: chat._id, from: req.user._id, message: message.toString() });
    if(chat.lastMessages.messages.length == 0) {
        chat.lastMessages = { from: req.user._id, messages: [newMessage._id] }
    } else {
        chat.lastMessages.messages.push(newMessage._id);
    }
    try {
        await newMessage.save();
        await chat.save();
        return res.status(200).json({ success: true });
    } catch (error) {
        const catchError = new Error('Algo salió mal');
        return res.status(404).json({ msg: catchError.message });
    }
}

export const updateMessage = async (req, res) => {

}

export const deleteMessage = async (req, res) => {

}

export const setMessagesRead = async (req, res) => {
    const chatId = req.body.chatId;

    if(!chatId) {
        const error = new Error('Debes especificar el id del chat');
        return res.status(404).json({ msg: error.message });
    }

    if(!ObjectId.isValid(chatId)) {
        const error = new Error('ID no válido');
        return res.status(404).json({ msg: error.message });
    }

    const chat = await Chat.findById(chatId);
    if(!chat) {
        const error = new Error('Algo salió mal');
        return res.status(404).json({ msg: error.message });
    }

    chat.lastMessages.from = null;
    chat.lastMessages.messages = [];

    try {
        await chat.save();
        return res.status(200).json({ msg: 'ok' });
    } catch (error) {
        const catchError = new Error('Algo salió mal');
        return res.status(404).json({ msg: catchError.message });
    }
}
