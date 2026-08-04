const { createClient } = require('redis');

const host = process.env.REDIS_HOST;
const port = process.env.REDIS_PORT || 6379;
const password = process.env.REDIS_PASSWORD;

// Support cloud TLS/SSL connections if password is provided
let redisUrl = `redis://${host}:${port}`;
if (password) {
    redisUrl = `rediss://default:${password}@${host}:${port}`;
}

const redisClient = createClient({
    url: redisUrl,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) return new Error('[Redis] Connection retries exhausted');
            return Math.min(retries * 100, 3000);
        }
    }
});

redisClient.on('error', (err) => console.error('[Redis] Client Error:', err));
redisClient.on('connect', () => console.log('[Redis] Connected successfully.'));

redisClient.connect().catch((err) => {
    console.error('[Redis] Failed to connect on startup:', err.message);
});

module.exports = redisClient;
