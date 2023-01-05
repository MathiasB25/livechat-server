import express from 'express'
import { getChats, getMessages, createMessage, updateMessage, deleteMessage } from '../controllers/chatController.js'
import checkAuth from '../middleware/checkAuth.js'

const router = express.Router()

router.route('/')
    .get( checkAuth, getChats )
router.get('/messages/:user', checkAuth, getMessages )
router.route('/messages')
    .post( checkAuth, createMessage )
    .put( checkAuth, updateMessage )
    .delete( checkAuth, deleteMessage )

export default router