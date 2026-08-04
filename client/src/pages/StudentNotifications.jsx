import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'date-fns';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const { data } = await axiosInstance.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      await axiosInstance.put('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-primary">Notifications</h2>
          <p className="text-muted-foreground">Stay updated on your pass approvals and scan logs.</p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs px-3.5 py-2 font-semibold bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-lg transition-colors shadow-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm divide-y divide-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <Bell size={48} className="opacity-20 text-muted-foreground animate-bounce" />
            <p>You have no notifications yet.</p>
          </div>
        ) : (
          notifications.map(notif => (
            <div
              key={notif._id}
              className={`p-4 flex gap-4 items-start transition-colors ${notif.isRead ? 'opacity-70 bg-transparent' : 'bg-primary/5'}`}
            >
              <div className={`p-2.5 rounded-lg shrink-0 ${notif.title.includes('Reject') ? 'bg-destructive/10 text-destructive' : 'bg-emerald-500/10 text-emerald-600'}`}>
                {notif.title.includes('Reject') ? <ShieldAlert size={18} /> : <CheckCircle2 size={18} />}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start gap-4">
                  <h4 className="font-bold text-sm text-foreground">{notif.title}</h4>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {format(new Date(notif.createdAt), 'dd MMM, HH:mm')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{notif.message}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default StudentNotifications;
