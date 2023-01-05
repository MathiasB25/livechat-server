import express from 'express'
import { register, authenticate, confirm, forgotPass, checkToken, newPassword, profile, changeProfileImage, changeStatus, changeBannerColor, getFriendRequests, deleteFriendRequest, addFriend, acceptFriend, blockFriend, unblockFriend, removeFriend } from '../controllers/userController.js'
import checkAuth from '../middleware/checkAuth.js'

const router = express.Router()

// Authentication, registration and confirmation of Users
router.post('/', register) //Create new user
router.post('/login', authenticate) //Authenticate user
router.get('/confirm/:token', confirm) // Confirm user
router.post('/reset-password', forgotPass)
router.route('/reset-password/:token')
    .get(checkToken)
    .post(newPassword)

// Get profile
router.route('/profile')
    .get( checkAuth, profile )
    .post( checkAuth, changeProfileImage )
router.post('/status', checkAuth, changeStatus);
router.post('/banner', checkAuth, changeBannerColor);

// Friends
router.route('/friends')
    .post( checkAuth, addFriend )
    .delete( checkAuth, removeFriend )
router.put('/friends/block', checkAuth, blockFriend);
router.put('/friends/unblock', checkAuth, unblockFriend);
router.get('/friends/requests', checkAuth, getFriendRequests)
router.route('/friends/requests/:request')
    .get( checkAuth, acceptFriend )
    .delete( checkAuth, deleteFriendRequest)

export default router