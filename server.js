const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
require('dotenv').config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT;

let httpServer;
if (isProduction) {
    const sslOptions = {
        key: fs.readFileSync(process.env.KEY),
        cert: fs.readFileSync(process.env.CERT)
    };
    httpServer = https.createServer(sslOptions, app);
} else {
    httpServer = createServer(app);
}

const allowedOrigins = isProduction
    ? [
        "https://sockettasker.taskerlaravelapi.ru",
        "https://taskerlaravelapi.ru",
        "https://spa.taskerlaravelapi.ru",
        "https://api.taskerlaravelapi.ru",
    ]
    : [
        "http://localhost:8080",
        "http://127.0.0.1:8080"
    ];

const io = new Server(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('subscribe', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    socket.on('subscribeToList', (listId) => {
        socket.join(`list_${listId}`);
        console.log(`User ${socket.id} subscribed to list ${listId}`);
    });

    socket.on('unsubscribeFromList', (listId) => {
        socket.leave(`list_${listId}`);
    });

    socket.on("connect_error", (err) => {
        console.log(err.message, err.description, err.context);
    });
});

// API Routes
const apiRoutes = [
    '/api/updates-on-list',
    '/api/send-new-sort-lists-count',
    '/api/send-new-personal-lists-count',
    '/api/send-new-personal-tags'
];

apiRoutes.forEach(route => {
    app.post(route, (req, res) => {
        try {
            const { action, listId, list, task, taskId, tag, room, message, uuid } = req.body;

            // Route-specific logic
            if (route === '/api/updates-on-list') {
                if (action === 'update_task') {
                    io.to(room).emit('taskUpdated', {task, uuid});
                } else if (action === 'create_task') {
                    io.to(room).emit('taskCreated', {task, uuid});
                } else if (action === 'delete_task') {
                    io.to(room).emit('taskDeleted', {taskId, uuid});
                } else if (action === 'update_list') {
                    io.to(room).emit('listUpdated', {list, uuid});
                } else if (action === 'create_tag_task') {
                    io.to(room).emit('createdTagTask', {tag, taskId, uuid});
                } else if (action === 'add_tag_task') {
                    io.to(room).emit('addTagTask', {tag, taskId, uuid});
                } else if (action === 'delete_tag_task') {
                    io.to(room).emit('deleteTagTask', {tag, taskId, uuid});
                } else if (action === 'delete_tag') {
                    io.to(room).emit('deleteTag', {tag, uuid});
                } else if (action === 'update_tag') {
                    io.to(room).emit('updateTag', {tag, taskId, uuid});
                }
            } else {
                if (!room || !message) {
                    return res.status(400).json({ error: 'Invalid request data' });
                }
                const eventName = route.split('/').pop().replace(/-/g, '_');
                //console.log("room: " + room)
                //console.log("eventName: " + eventName)
                //console.log(message)
                io.to(room).emit(eventName, {message, uuid});
            }

            res.json({ status: 'ok' });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });
});

app.get('/', (req, res) => {
    res.send('Hello from Express!');
});

httpServer.listen(PORT, () => {
    console.log(`Socket.io server running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode on port ${PORT}`);
    console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});