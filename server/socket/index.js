let io;

module.exports = {
    init: (httpServer) => {
        const { Server } = require('socket.io');
        io = new Server(httpServer, {
            cors: {
                origin: "*", // Replace with frontend URL in production
                methods: ["GET", "POST"]
            }
        });
        return io;
    },
    getIo: () => {
        if (!io) {
            console.error('Socket.io not initialized!');
        }
        return io;
    }
};
