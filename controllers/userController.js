import axios from "axios";
import mongoose from "mongoose";
// Models
import User from "../models/User.js"
import FriendRequest from "../models/FriendRequest.js"
// Helpers
import createId from "../helpers/createId.js"
import createJWT from "../helpers/createJWT.js"
import { emailRegister, emailResetPassword } from "../helpers/email.js";
import FormData from 'form-data'
import fs from 'fs';
import sha1 from 'sha1'
import client from 'http';
import url from 'url';

const ObjectId = mongoose.Types.ObjectId;
export const register = async (req, res) => {
    // Check if user/email already exists
    const { email, username } = req.body;

    const emailExist = await User.findOne({ email });
    if(emailExist) {
        const error = new Error('Ya hay un usuario registrado con este correo electrónico')
        return res.status(400).json({ msg: error.message })
    }

    req.body.tag = Math.floor(1000 + Math.random() * 9000);
    const userExists = await User.findOne({ username_lowercase: username.toLowerCase(), tag: req.body.tag });

    if(userExists) {
        const fetchAllUsers = await User.find({ username_lowercase: username.toLowerCase(), tag: req.body.tag });
        for( let i = 0; i < fetchAllUsers.length; i++) {
            if(req.body.tag === fetchAllUsers[i].tag) {
                req.body.tag = (Math.floor(1000 + Math.random() * 9000).toString());
                if( i === fetchAllUsers.length && req.body.tag === fetchAllUsers[i].tag) {
                    const error = new Error('Este nombre de usuario no está disponible');
                    return res.status(400).json({ msg: error.message });
                }
            } else {
              break;
            }
        }
    }

    // Create and send user to DB
    try {
        req.body.username_lowercase = req.body.username.toLowerCase();
        const user = new User(req.body)
        user.token = createId()
        await user.save()
        // Send confirmation email
        const { email, username, token } = user
        emailRegister({
            email,
            username,
            token
        })

        res.json({ msg: `Usuario creado correctamente, revisa tu email para confirmar tu cuenta` })
    } catch (error) {
        console.log(error)
    }
}

export const authenticate = async (req, res) => {
    const { email, password } = req.body

    // Check if email exists
    const user = await User.findOne({ email })
    if(!user) {
        const error = new Error('El usuario no existe')
        return res.status(404).json({ msg: error.message })
    }
    // Check if user is confirmed
    if (!user.confirmed) {
        const error = new Error('Tu cuenta no ha sido confirmada')
        return res.status(403).json({ msg: error.message })
    }
    // Check user password
    if(await user.checkPassword(password)) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            token: createJWT(user._id)
        })
    } else {
        const error = new Error('Contraseña incorrecta')
        return res.status(403).json({ msg: error.message })
    }
}

export const confirm = async (req, res) => {
    const { token } = req.params
    const user = await User.findOne({token})
    if (!user) {
        const error = new Error('Token no válido')
        return res.status(403).json({ msg: error.message })
    }

    try {
        user.confirmed = true
        user.token = ''
        await user.save()
        res.json({ msg: 'Usuario confirmado correctamente' })
    } catch (error) {
        res.json({ msg: 'Hubo un error al confirmar tu usuario' })
    }
}

export const forgotPass = async (req, res) => {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
        const error = new Error('El usuario no existe')
        return res.status(404).json({ msg: error.message })
    }

    try {
        user.token = createId()
        await user.save()
        
        // Send email
        const { email, name, token } = user
        emailResetPassword({
            email,
            name,
            token
        })

        res.json({ msg: "Hemos enviado las instrucciones a tu email" })
    } catch (error) {
        console.log(error)
    }
}

export const checkToken = async (req, res) => {
    const { token } = req.params

    const user = await User.findOne({ token })

    if(user) {
        res.json({ msg: 'Valid token and User exists' })
    } else {
        const error = new Error('Invalid Token')
        return res.status(403).json({ msg: error.message })
    }

}

export const newPassword = async (req, res) => {
    const { token } = req.params
    const { password } = req.body

    const user = await User.findOne({ token })

    if (user) {
        user.password = password
        user.token = ''
        try {
            await user.save()
            res.json({ msg: 'Has cambiado tu contraseña correctamente' })
        } catch (error) {
            console.log(error)
        }
    } else {
        const error = new Error('Invalid Token')
        return res.status(403).json({ msg: error.message })
    }
}

export const profile = async (req, res) => {
    const { user: fetchedUser } = req

    await fetchedUser.populate({ path: 'friends', select: 'username tag profilePhoto bannerColor friends status createdAt' });
    let user = JSON.parse(JSON.stringify(fetchedUser));
    user.friends.map( friend => {
        if(user.blocked_friends.length != 0) {
            user.blocked_friends.map( blockedFriend => {
                if(friend._id === blockedFriend) {
                    friend.blocked = true;
                } else {
                    friend.blocked = false;
                }
            })
        } else {
            friend.blocked = false;
        }
    })
    res.json(user) 
}

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        client.get(url, (res) => {
            if (res.statusCode === 200) {
                res.pipe(fs.createWriteStream(filepath))
                    .on('error', reject)
                    .once('close', () => resolve(filepath));
            } else {
                // Consume response data to free up memory
                res.resume();
                reject(new Error(`Request Failed With a Status Code: ${res.statusCode}`));

            }
        });
    });
}

export const changeProfileImage = async (req, res) => {
    const user = req.user;
    const { url } = req.body;

    await downloadImage(`${process.env.CLIENT_URL}/${url}`, `./public/img/${url.split('/')[2]}`)

    const formData = new FormData();
    const actualDate = Date.now();
    const signature = sha1(`public_id=${`${user.username}_${user.tag}`}&timestamp=${actualDate}` + 'l_aOGe-EFkJX9R91Er2n1R5-6xg');
    const file = fs.createReadStream(`public/img/${url.split('/')[2]}`);
    formData.append("file", file);
    formData.append('public_id', `${user.username}_${user.tag}`);
    formData.append('signature', signature);
    formData.append('api_key', '859662841892153');
    formData.append('timestamp', actualDate);

    try {
        const { data } = await axios.request({
            method: 'POST',
            url: 'https://api.cloudinary.com/v1_1/djodj3fio/image/upload',
            headers: { 
                'Authorization': 'Basic ODU5NjYyODQxODkyMTUzOnt7YXBpX3NlY3JldH19', 
                'Cookie': '_cld_session_key=719c01deb85f0694be5b8fe24d16f026', 
                ...formData.getHeaders()
              },
            data: formData
        })
        fs.unlink(`public/img/${url.split('/')[2]}`, function() {
            console.log('Streaming file removed');
        })

        user.profilePhoto = data.url;
        await user.save();
        return res.status(200).json({ data })
    } catch (error) {
        const catchError = new Error('No se ha podido cambiar tu foto de perfil');
        return res.json({ msg: catchError.message })
    }
}

export const changeProfileImage_ = async (req, res) => {
    const user = req.user;
    
    const formData = new FormData();
    
    var fstream;
    req.pipe(req.busboy);
    req.busboy.on('file', async function (fieldname, file, filename) {
        fstream = fs.createWriteStream('public' + '/img/' + filename.filename);
        file.pipe(fstream);
        fstream.on('close', function () {    
            console.log("Upload Finished of " + filename.filename);         
        });
        const actualDate = Date.now();
        const signature = sha1(`public_id=${`${user.username}_${user.tag}`}&timestamp=${actualDate}` + 'l_aOGe-EFkJX9R91Er2n1R5-6xg');
        const stream = fs.createReadStream('public' + '/img/' + filename.filename);
        console.log(stream)
        formData.append("file", stream);
        formData.append('public_id', `${user.username}_${user.tag}`);
        formData.append('signature', signature);
        formData.append('api_key', '859662841892153');
        formData.append('timestamp', actualDate);
        
        // await axios.request({
        //     method: 'POST',
        //     url: 'https://api.cloudinary.com/v1_1/djodj3fio/image/destroy',
        //     headers: { 
        //         'Authorization': 'Basic ODU5NjYyODQxODkyMTUzOnt7YXBpX3NlY3JldH19', 
        //         'Cookie': '_cld_session_key=719c01deb85f0694be5b8fe24d16f026', 
        //         ...formData.getHeaders()
        //       },
        //     data: formData
        // })
        
        try {
            const { data } = await axios.request({
                method: 'POST',
                url: 'https://api.cloudinary.com/v1_1/djodj3fio/image/upload',
                headers: { 
                    'Authorization': 'Basic ODU5NjYyODQxODkyMTUzOnt7YXBpX3NlY3JldH19', 
                    'Cookie': '_cld_session_key=719c01deb85f0694be5b8fe24d16f026', 
                    ...formData.getHeaders()
                  },
                data: formData
            })
            fs.unlink('public' + '/img/' + filename.filename, function() {
                console.log('Streaming file removed');
            })
            user.profilePhoto = data.url;
            await user.save();
            return res.json({ success: true })
        } catch (error) {
            // fs.unlink('public' + '/img/' + filename.filename, function() {
            //     console.log('Streaming file removed');
            // })
            const catchError = new Error('No se ha podido cambiar tu foto de perfil');
            return res.json({ msg: catchError.message })
        }

    });
}

export const changeStatus = async (req, res) => {
    const status = req.body.status;
    console.log(status)

    if(!status) {
        const error = new Error('Algo salió mal');
        return res.status(404).json({ msg: error.message });
    }

    const allowedStatus = ['online', 'away', 'occupied', 'invisible', 'offline'];
    if(!allowedStatus.includes(status.toLowerCase())) {
        const error = new Error('Este estado no es válido');
        return res.status(404).json({ msg: error.message });
    }

    if(req.user.status === status.toLowerCase()) {
        const error = new Error('Este ya es tu estado actual');
        return res.status(404).json({ msg: error.message });
    }

    req.user.status = status.toLowerCase();
    try {
        req.user.save();
        return res.status(200).json({ msg: `Tu estado ha cambiado a ${status}` });
    } catch (error) {
        const catchError = new Error('Algo salió mal');
        return res.status(404).json({ msg: catchError.message });
    }
}

export const changeBannerColor = async (req, res) => {
    const color = req.body.color;

    // Validate if 'color' is a hex color
    const regex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const isValid = regex.test(color);
    if(!isValid) {
        const error = new Error('Este color no es válido');
        return res.status(404).json({ msg: error.message });
    }

    const user = req.user;
    user.bannerColor = color;

    try {
        user.save();
        return res.status(200).json({ msg: 'Cambiaste el color de tu banner' });
    } catch (error) {
        const catchError = new Error('Algo salió mal');
        return res.status(404).json({ msg: catchError.message });
    }
}

// Friends

export const getFriendRequests = async (req, res) => {
    try {        
        const friendRequests = await FriendRequest.find({ $or: [{ from: req.user._id }, { to: req.user._id }] }).populate({ path: 'from', select: 'username tag profilePhoto friends' }).populate({ path: 'to', select: 'username profilePhoto friends' }).select('-__v -createdAt -updatedAt')
        return res.status(200).json(friendRequests)
    } catch (error) {
        const catchError = new Error('Algo salió mal')
        return res.status(404).json({ msg: catchError.message })
    }
}

export const addFriend = async (req, res) => {
    const username = req.body.username;
    const tag = req.body.tag;

    if(!username || !tag) {
        const error = new Error('Algo salió mal')
        return res.status(404).json({ msg: error.message })
    }

    if(Number(tag).toString().length !== 4) {
        const error = new Error('El tag no es válido')
        return res.status(404).json({ msg: error.message })
    }

    const userExists = await User.findOne({ username, tag }).select('username tag profilePhoto friends');
    if(!userExists) {
        const error = new Error('Este usuario no existe')
        return res.status(404).json({ msg: error.message })
    }

    if(req.user.friends.length != 0) {
        let alreadyFriends = false;
        req.user.friends.map( friend => {
            if(friend.toString() === userExists._id.toString()) {
                alreadyFriends = true;
            }
        })
        if(alreadyFriends) {
            const error = new Error('Esta persona ya es tu amigo/a')
            return res.status(404).json({ msg: error.message })
        }
    }

    if(userExists._id.toString() === req.user._id.toString()) {
        const error = new Error('Eso no es posible')
        return res.status(404).json({ msg: error.message })
    }

    const friendRequestExists = await FriendRequest.findOne({ $or: [{ from: req.user._id, to: userExists._id }, { to: req.user._id, from: userExists._id }] })
    if(friendRequestExists) {
        const error = new Error('Ya hay una solicitud pendiente con este usuario')
        return res.status(404).json({ msg: error.message })
    }

    const newFriendRequest = new FriendRequest({ from: req.user, to: userExists })

    try {
        await newFriendRequest.save();
        return res.status(200).json({ msg: `Enviaste una solicitud de amistad a @${userExists.username}`, data: newFriendRequest })
    } catch (error) {
        const catchError = new Error('Algo salió mal')
        return res.status(404).json({ msg: catchError.message })
    }
}

export const acceptFriend = async (req, res) => {
    const { request } = req.params;

    if(!ObjectId.isValid(request)) {
        const error = new Error('Algo salió mal')
        return res.status(404).json({ msg: error.message })
    }

    const friendRequest = await FriendRequest.findById(request).populate('from').populate('to');
    if(!friendRequest) {
        const error = new Error('Esta solicitud de amistad no existe')
        return res.status(404).json({ msg: error.message })
    }

    const { from, to } = friendRequest;

    if( to._id.toString() !== req.user._id.toString() ) {
        const error = new Error('No tienes permisos para aceptar esta solicitud de amistad')
        return res.status(404).json({ msg: error.message })
    }

    try {
        // Add friends to users
        from.friends.push(to._id);
        to.friends.push(from._id);
        await from.save();
        await to.save();
        // Remove friend request
        await friendRequest.remove();
        return res.status(200).json({ msg: `Aceptaste la solicitud de amistad de @${from.username}` })
    } catch (error) {
        const catchError = new catchError('Algo salió mal')
        return res.status(404).json({ msg: error.message })
    }
}

export const deleteFriendRequest = async (req, res) => {
    const { request } = req.params;

    if(!ObjectId.isValid(request)) {
        const error = new Error('Algo salió mal')
        return res.status(404).json({ msg: error.message })
    }

    const friendRequest = await FriendRequest.findById(request);
    if(!friendRequest) {
        const error = new Error('Esta solicitud de amistad no existe')
        return res.status(404).json({ msg: error.message })
    }

    if(friendRequest.from.toString() != req.user._id.toString() && friendRequest.to.toString() != req.user._id.toString()) {
        const error = new Error('No tienes permisos para eliminar esta petición de amistad')
        return res.status(404).json({ msg: error.message })
    }

    try {
        await friendRequest.remove();
        return res.status(200).json({ msg: `${ friendRequest.from.toString() == req.user._id.toString() ? 'Cancelaste' : 'Rechazaste'} esta solicitud de amistad` })
    } catch (error) {
        const catchError = new Error('Algo salió mal')
        return res.status(404).json({ msg: catchError.message })
    }
}

export const blockFriend = async (req, res) => {
    const userId = req.body.userId;

    if(!ObjectId.isValid(userId)) {
        const error = new Error('Usuario no válido')
        return res.status(404).json({ msg: error.message })
    }

    const userExists = await User.findById(userId);
    if(!userExists) {
        const error = new Error('Este usuario no existe')
        return res.status(404).json({ msg: error.message })
    }

    const me = await User.findById(req.user._id);
    let alreadyBlocked = false;
    if(me.blocked_friends.includes(userId)) {
        alreadyBlocked = true;
    }
    if(alreadyBlocked) {
        return res.status(404).json({ msg: 'Ya bloqueaste a este usuario' })
    }

    me.blocked_friends.push(userId);
    try {
        await me.save();
        return res.status(200).json({ msg: `Bloqueaste a ${userExists.username}` })
    } catch (error) {
        const catchError = new Error('Algo salió mal')
        return res.status(404).json({ msg: catchError.message })
    }
}

export const unblockFriend = async (req, res) => {
    const userId = req.body.userId;

    if(!ObjectId.isValid(userId)) {
        const error = new Error('Usuario no válido')
        return res.status(404).json({ msg: error.message })
    }

    const userExists = await User.findById(userId);
    if(!userExists) {
        const error = new Error('Este usuario no existe')
        return res.status(404).json({ msg: error.message })
    }

    const me = await User.findById(req.user._id);
    let alreadyBlocked = false;
    if(me.blocked_friends.includes(userId)) {
        alreadyBlocked = true;
    }
    if(!alreadyBlocked) {
        const error = new Error('No has bloqueado a este usuario')
        return res.status(404).json({ msg: error.message })
    }

    me.blocked_friends = me.blocked_friends.filter( blocked => {
        blocked != userId;
    });
    try {
        await me.save();
        return res.status(200).json({ msg: `Desbloqueaste a ${userExists.username}` })
    } catch (error) {
        const catchError = new Error('Algo salió mal');
        return res.status(404).json({ msg: catchError.message })
    }
}

export const removeFriend = async (req, res) => {
    const userId = req.body.userId;

    if(!ObjectId.isValid(userId)) {
        const error = new Error('Usuario no válido')
        return res.status(404).json({ msg: error.message })
    }

    const userExists = await User.findById(userId);
    if(!userExists) {
        const error = new Error('Este usuario no existe')
        return res.status(404).json({ msg: error.message })
    }

    const me = await User.findById(req.user._id);
    const meNewFriends = me.friends.filter( friend => friend.toString() !== userExists._id.toString() );
    me.friends = meNewFriends;

    const userNewFriends = userExists.friends.filter( friend => friend.toString() !== me._id.toString() );
    userExists.friends = userNewFriends;

    try {
        await me.save();
        await userExists.save();
        return res.status(200).json({ msg: `Eliminaste a ${userExists.username}` })
    } catch (error) {
        const catchError = new Error('Algo salió mal')
        return res.status(404).json({ msg: catchError.message })
    }
}