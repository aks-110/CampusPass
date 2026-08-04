const cron = require('node-cron');
const { GatePass } = require('../models/sql/associations');
const { Op } = require('sequelize');

const startCronJobs = () => {
    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            const now = new Date();
            
            // 1. Expire passes where the student never checked out (exitTime is null)
            const [expiredCount] = await GatePass.update(
                { status: 'Expired' },
                {
                    where: {
                        status: 'Approved',
                        returnDate: { [Op.lt]: now },
                        exitTime: null
                    }
                }
            );

            if (expiredCount > 0) {
                console.log(`[Cron] Marked ${expiredCount} unused gate passes as Expired.`);
            }

            // 2. Mark passes as Overdue where the student checked out but returnDate has passed
            const [overdueCount] = await GatePass.update(
                { status: 'Overdue' },
                {
                    where: {
                        status: 'Approved',
                        returnDate: { [Op.lt]: now },
                        exitTime: { [Op.ne]: null },
                        entryTime: null
                    }
                }
            );

            if (overdueCount > 0) {
                console.log(`[Cron] Marked ${overdueCount} active gate passes as Overdue (Late return).`);
            }
            
        } catch (error) {
            console.error('[Cron] Error in pass expiry job:', error);
        }
    });

    console.log('[Cron] Pass expiry job scheduled.');
};

module.exports = startCronJobs;
