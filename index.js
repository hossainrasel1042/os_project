require('./tracing');
const express = require('express');
const http = require('http');
const { v4: uuidv4 } = require('uuid');
const { trace } = require('@opentelemetry/api');
const path = require('path');
const tracer = trace.getTracer('chat-service');
const { register, httpRequestCounter } = require('./metrics'); // import metrics
const app = express();
const server = http.createServer(app);
// Middleware to count incoming HTTP requests for Prometheus
app.use((req, res, next) => {
  res.on('finish', () => {
    console.log(`Incrementing counter for ${req.method} ${req.route ? req.route.path : req.path} with status ${res.statusCode}`);
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
  res.send(`path not implement or define ok!`);
});

app.get('/compute', (req, res) => {
  const span = tracer.startSpan('cpu-intensive-task');

  // CPU-intensive task: calculate nth Fibonacci number (slow recursive)
  function fib(n) {
    if (n <= 1) return n;
    return fib(n - 1) + fib(n - 2);
  }

  const n = parseInt(req.query.n) || 37; // Default is fib(37)
  const result = fib(n);

  span.end();
  res.send(`fib(${n}) = ${result}`);
});

app.listen(3000, '0.0.0.0', () => {
  console.log('Server listening on port 3000');
});

