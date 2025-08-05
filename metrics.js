const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Collect default metrics every 5 seconds
client.collectDefaultMetrics({
  register,
  prefix: '', // optional prefix
  gcDurationBuckets: [0.001, 0.01, 0.1, 1],
});

// Create HTTP request counter metric with labels
const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Register the counter
register.registerMetric(httpRequestCounter);

module.exports = {
  register,
  httpRequestCounter,
};

