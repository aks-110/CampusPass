require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const path = require('path');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const sequelize = require('./config/pg');
require('./models/sql/associations'); // Load SQL associations

// Initialize Express App
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Connect to Supabase PostgreSQL
sequelize.authenticate()
    .then(() => {
        console.log('Supabase PostgreSQL Connected successfully.');
        return sequelize.sync();
    })
    .then(() => {
        console.log('Supabase PostgreSQL Models Synced.');
    })
    .catch((err) => {
        console.error('Unable to connect to Supabase PostgreSQL:', err);
    });

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
    origin: 'http://localhost:5173', // Update this if your frontend runs on a different port/URL
    credentials: true
}));
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan('dev'));

const authRoutes = require('./routes/authRoutes');
const passRoutes = require('./routes/passRoutes');
const gateRoutes = require('./routes/gateRoutes');
const adminRoutes = require('./routes/adminRoutes');
const hostelRoutes = require('./routes/hostelRoutes');
const reportRoutes = require('./routes/reportRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const startCronJobs = require('./cron/passExpiry');
const { Server } = require('socket.io');

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Vite default
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// Attach Socket.io to the req object so controllers can emit events
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Socket Connection Logic
io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);
    
    // User joins a room based on their database ID to receive direct notifications
    socket.on('join_room', (userId) => {
        socket.join(userId);
        console.log(`[Socket] User ${userId} joined their notification room.`);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
});

// Start Background Services
startCronJobs();
require('./workers/emailWorker'); // Start BullMQ Worker

// Basic Route
app.get('/', (req, res) => {
    res.send('CampusPass API is running...');
});

const { rateLimiter } = require('./middlewares/rateLimiter');
app.use('/api', rateLimiter({ windowMs: 15 * 60 * 1000, max: 200 }));

app.use('/api/auth', authRoutes);
app.use('/api/pass', passRoutes);
app.use('/api/gate', gateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


