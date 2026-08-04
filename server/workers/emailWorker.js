const { Worker } = require('bullmq');
const { connection } = require('../config/queue');
const { sendEmail } = require('../utils/emailService');

const emailWorker = new Worker('EmailQueue', async (job) => {
    console.log(`[Worker] Processing email job ${job.id} for: ${job.data.to}`);
    try {
        await sendEmail({
            to: job.data.to,
            subject: job.data.subject,
            html: job.data.html,
            text: job.data.text
        });
        console.log(`[Worker] Job ${job.id} sent successfully.`);
    } catch (error) {
        console.error(`[Worker] Job ${job.id} failed:`, error.message);
        throw error;
    }
}, { connection });

emailWorker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} has completed.`);
});

emailWorker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job.id} has failed with error:`, err.message);
});

module.exports = emailWorker;
