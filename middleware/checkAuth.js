import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const checkAuth = async (req, res, next) => {
    let token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1]
            
            const decoded = jwt.verify(token, process.env.JWT_SECRET)
            
            req.user = await User.findById(decoded.id).select('-username_lowercase -password -confirmed -token -createdAt -updatedAt -__v')

            if(!req.user) {
                const error = new Error('Invalid token')
                return res.status(401).json({ msg: error.message })
            }

            return next()
        } catch (error) {
            const catchError = new Error('There was a mistake')
            return res.status(404).json({ msg: catchError.message })
        }
    }

    if(!token) {
        const error = new Error('Invalid token')
        return res.status(401).json({ msg: error.message })
    }

    next()
}

export default checkAuth