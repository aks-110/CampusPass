const { Sequelize } = require('sequelize');

const pgUri = process.env.PG_URI;
if (!pgUri) {
    console.error('[Supabase] CRITICAL: PG_URI environment variable is missing in .env!');
    process.exit(1);
}

const sequelize = new Sequelize(pgUri, {
    dialect: 'postgres',
    logging: false, // Set to console.log to debug SQL queries if needed
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false // Supabase connections require SSL
        }
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

module.exports = sequelize;
