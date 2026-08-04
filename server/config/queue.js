const { Queue } = require('bullmq');

const connection = {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD
};

// Enable TLS for secure cloud redis providers like Upstash if password is set
if (process.env.REDIS_PASSWORD) {
    connection.tls = {};
}

const emailQueue = new Queue('EmailQueue', { connection });

module.exports = { emailQueue, connection };
