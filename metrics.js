const client = require('prom-client');

// Register for metrics
const register = new client.Registry();

// Collect default metrics every 5 seconds (default is 10s)
client.collectDefaultMetrics({
  register,
  prefix: '', // Optional: you can add a prefix like 'myapp_'
  gcDurationBuckets: [0.001, 0.01, 0.1, 1], // Optional for GC metrics
});
module.exports = register;