import express from 'express'
import { getChats, hideChat, getMessages, createMessage, updateMessage, deleteMessage, setMessagesRead } from '../controllers/chatController.js'
import checkAuth from '../middleware/checkAuth.js'

const router = express.Router()

router.route('/')
    .get( checkAuth, getChats )
    .delete( checkAuth, hideChat );
router.get('/messages/:user', checkAuth, getMessages );
router.route('/messages')
    .post( checkAuth, createMessage )
    .put( checkAuth, updateMessage )
    .delete( checkAuth, deleteMessage );
router.post('/messages/read', checkAuth, setMessagesRead);

export default router