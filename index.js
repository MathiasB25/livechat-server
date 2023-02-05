// Express
import express from 'express';
import connectBusboy from 'connect-busboy';
// Dotenv
import dotenv from 'dotenv';
// CORS
import cors from 'cors';
// DB Connection
import connectDB from './config/db.js';
// Routes
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
app.use(express.json());
app.use(connectBusboy()); 


// Dotenv
dotenv.config();

// Make the connection to MongoDB
connectDB();

// CORS
/* const whitelist = [process.env.CLIENT_URL];

const corsOptions = {
    origin: function(origin, callback) {
        if(whitelist.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('CORS Error'))
        }
    }
}

app.use(cors(corsOptions)) */

// Routing
app.use('/v1/users', userRoutes);
app.use('/v1/chat', chatRoutes);

// Server
const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`Server running in port: ${PORT}`)
})

// Socket.IO
import { Server } from 'socket.io';

const io = new Server(server, {
    pingTimeout: 60000,
    cors: {
        origin: process.env.CLIENT_URL
    }
});

io.on('connection', (socket) => {

    socket.on('joinGlobal', () => {
        socket.join('global');
    });

    socket.on('sendMessage', (message) => {
        // io.to('global').timeout(5000).emit("receiveMessage", message);
        socket.broadcast.timeout(5000).emit("receiveMessage", message);
    });

    socket.on('editMessage', (message) => {
        socket.broadcast.timeout(5000).emit("editedMessage", message);
    });

    socket.on('deleteMessage', (message) => {
        socket.broadcast.timeout(5000).emit("deletedMessage", message);
    });

    socket.on('userChangeStatus', (friend) => {
        socket.broadcast.timeout(5000).emit("userChangeStatus", friend);
    });

    socket.on('sendFriendRequest', (request) => {
        socket.broadcast.timeout(5000).emit("receiveFriendRequest", request);
    });

    socket.on('acceptFriendRequest', (request) => {
        socket.broadcast.timeout(5000).emit("acceptedFriendRequest", request);
    });

    socket.on('cancelFriendRequest', (request) => {
        socket.broadcast.timeout(5000).emit("canceledFriendRequest", request);
    });

    socket.on('deleteFriend', (users) => {
        socket.broadcast.timeout(5000).emit("deleteFriend", users);
    });

    socket.on('disconnect', function () {
        socket.removeAllListeners('sendMessage');
        // socket.removeAllListeners('disconnect');
        // io.removeAllListeners('connection');
    });

});