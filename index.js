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
        console.log('user joined')
    });

    socket.on('sendMessage', (message) => {
        // io.to('global').timeout(5000).emit("receiveMessage", message);
        socket.broadcast.timeout(5000).emit("receiveMessage", message);
        console.log(message);
    });

    socket.on('disconnect', function () {
        socket.removeAllListeners('sendMessage');
        // socket.removeAllListeners('disconnect');
        // io.removeAllListeners('connection');
    });

});