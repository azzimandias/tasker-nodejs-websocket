const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:8080",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('subscribe', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });
    socket.on('sendMessage', (data) => {
        io.to(data.room).emit('newMessage', data.message);
    });
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });

    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Подписка на комнату конкретного списка
    socket.on('subscribeToList', (listId) => {
        socket.join(`list_${listId}`);
        console.log(`User ${socket.id} subscribed to list ${listId}`);
    });
    // Отписка от комнаты
    socket.on('unsubscribeFromList', (listId) => {
        socket.leave(`list_${listId}`);
    });
});

// Эндпоинт для обновлений от Laravel
app.post('/api/task-updates', (req, res) => {
    const { action, listId, task, taskId } = req.body;

    if (action === 'update') {
        io.to(`list_${listId}`).emit('taskUpdated', task);
    }
    else if (action === 'create') {
        io.to(`list_${listId}`).emit('taskCreated', task);
    }
    else if (action === 'delete') {
        io.to(`list_${listId}`).emit('taskDeleted', taskId);
    }

    res.json({ status: 'ok' });
});

app.post('/api/send-new-sort-lists-count', (req, res) => {
    try {
        console.log('Received body:', req.body);

        if (!req.body || !req.body.room || !req.body.message) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const { room, message } = req.body;
        io.to(room).emit('new_sort_lists_count', message);

        res.json({ status: 'Message sent!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/send-new-personal-lists-count', (req, res) => {
    try {
        console.log('Received body:', req.body);

        if (!req.body || !req.body.room || !req.body.message) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const { room, message } = req.body;
        io.to(room).emit('new_personal_lists_count', message);

        res.json({ status: 'Message sent!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/send-new-personal-tags', (req, res) => {
    try {
        console.log('Received body:', req.body);

        if (!req.body || !req.body.room || !req.body.message) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const { room, message } = req.body;
        io.to(room).emit('new_personal_tags', message);

        res.json({ status: 'Message sent!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/send-new-personal-list', (req, res) => {
    try {
        console.log('Received body:', req.body);

        if (!req.body || !req.body.room || !req.body.message) {
            return res.status(400).json({ error: 'Invalid request data' });
        }

        const { room, message } = req.body;
        io.to(room).emit('new_info_from_sort_list', message);

        res.json({ status: 'Message sent!' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket.io server running on port ${PORT}`);
});
