import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Eye, Calendar, Moon, Sun } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'date-fns';
import { useTheme } from '../context/ThemeContext';

const AdminSettings = () => {
  const { theme, toggleTheme } = useTheme();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/admin/audit-logs');
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch audit logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-primary">System Settings & Auditing</h2>
        <p className="text-muted-foreground">Monitor administrative actions and set interface preferences.</p>
      </div>

      {/* Visual Preference Toggle */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-foreground">Global Theme Option</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Toggle between light and dark modes.</p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold rounded-lg transition-colors shadow-sm text-sm"
        >
          {theme === 'light' ? (
            <>
              <Moon size={18} /> Dark Theme
            </>
          ) : (
            <>
              <Sun size={18} className="text-amber-500" /> Light Theme
            </>
          )}
        </button>
      </div>

      {/* System Audit Logs */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-border bg-secondary/10 flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
            <Shield size={20} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Admin Audit Logs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Cryptographically logged system events for transparency.</p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground italic">No administrative logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-xs text-left">
              <thead className="bg-secondary/5 text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-3">Administrator</th>
                  <th className="px-6 py-3">Action Description</th>
                  <th className="px-6 py-3">Device / IP</th>
                  <th className="px-6 py-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map(log => (
                  <tr key={log._id} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-6 py-4 font-semibold text-foreground">
                      {log.user?.name || 'Unknown'} <br/>
                      <span className="text-[10px] font-normal text-muted-foreground">{log.user?.email}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{log.action}</td>
                    <td className="px-6 py-4 text-muted-foreground font-medium">
                      IP: {log.ipAddress || 'N/A'} <br/>
                      <span className="text-[9px] truncate block max-w-[200px]" title={log.device}>{log.device || 'N/A'}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground">
                      {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminSettings;
