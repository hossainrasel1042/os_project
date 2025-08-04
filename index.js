const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    const userId = uuidv4();
    res.redirect(`/chat?uid=${userId}`);
});

// Serve chat.html when /chat is visited
app.get('/chat', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

io.on('connection', (socket) => {
    let username = null;

    socket.on('join', (userId) => {
        username = userId;
        socket.broadcast.emit('chat message', `🟢 ${username} joined the chat`);
    });

    socket.on('chat message', (msg) => {
        io.emit('chat message', `${username}: ${msg}`);
    });

    socket.on('disconnect', () => {
        if (username)
            io.emit('chat message', `🔴 ${username} left the chat`);
    });
});

server.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});

