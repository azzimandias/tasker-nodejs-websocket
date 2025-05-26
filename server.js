const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:8080", // Замените на URL вашего Vue-приложения (например, "http://localhost:3000")
        methods: ["GET", "POST"]
    }
});

// Обработка подключений
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Пример: подписка на канал "chat"
    socket.on('subscribe', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });

    // Пример: отправка сообщения в комнату
    socket.on('sendMessage', (data) => {
        io.to(data.room).emit('newMessage', data.message);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = 3001; // Порт WebSocket-сервера
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});
