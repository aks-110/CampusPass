import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const { isAuthenticated, user } = useSelector(state => state.auth);
    const [socket, setSocket] = useState(null);
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        if (isAuthenticated && user) {
            // Connect to server
            const newSocket = io('http://localhost:5000', {
                withCredentials: true
            });

            // Join personal room
            newSocket.emit('join_room', user.id);

            // Listen for notifications
            newSocket.on('notification', (data) => {
                const newToast = { id: Date.now(), ...data };
                setToasts(prev => [...prev, newToast]);
                
                // Auto-remove toast after 5 seconds
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== newToast.id));
                }, 5000);
            });

            setSocket(newSocket);

            return () => newSocket.close();
        }
    }, [isAuthenticated, user]);

    const removeToast = (id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <SocketContext.Provider value={{ socket }}>
            {children}
            
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-card border border-border shadow-2xl rounded-xl p-4 w-80 pointer-events-auto flex items-start gap-3 relative overflow-hidden group"
                        >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
                            <div className="bg-primary/10 text-primary p-2 rounded-full shrink-0">
                                <Bell size={18} />
                            </div>
                            <div className="flex-1 pr-6">
                                <h4 className="font-bold text-sm text-foreground">{toast.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">{toast.message}</p>
                            </div>
                            <button 
                                onClick={() => removeToast(toast.id)}
                                className="absolute right-2 top-2 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={16} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </SocketContext.Provider>
    );
};
