require('./tracing');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { trace } = require('@opentelemetry/api');
const path = require('path');
const tracer = trace.getTracer('chat-service');
const { register, httpRequestCounter } = require('./metrics');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware to count incoming HTTP requests for Prometheus
app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.route ? req.route.path : req.path,
      status_code: res.statusCode,
    });
  });
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

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

  // 🔵 Trace join event
  socket.on('join', (userId) => {
    const span = tracer.startSpan('socket.io:join', {
      attributes: {
        event: 'join',
        socket_id: socket.id,
        user_id: userId,
      },
    });

    username = userId;
    socket.broadcast.emit('chat message', `🟢 ${username} joined the chat`);
    span.end();
  });

  // 💬 Trace message event
  socket.on('chat message', (msg) => {
    const span = tracer.startSpan('socket.io:chat message', {
      attributes: {
        event: 'chat message',
        socket_id: socket.id,
      },
    });

    io.emit('chat message', `${username}: ${msg}`);
    span.end();
  });

  // ❌ Trace disconnect event
  socket.on('disconnect', () => {
    const span = tracer.startSpan('socket.io:disconnect', {
      attributes: {
        event: 'disconnect',
        socket_id: socket.id,
      },
    });

    if (username) {
      io.emit('chat message', `🔴 ${username} left the chat`);
    }

    span.end();
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

