import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Users, LogIn, LogOut, Download, ShieldAlert } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import * as XLSX from 'xlsx';

const MainGateAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [exitLogs, setExitLogs] = useState([]);
  const [entryLogs, setEntryLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGateAnalytics = async () => {
    try {
      const statsRes = await axiosInstance.get('/reports/stats');
      const exitsRes = await axiosInstance.get('/gate/logs?action=Exit');
      const entriesRes = await axiosInstance.get('/gate/logs?action=Return');
      
      setStats(statsRes.data);
      setExitLogs(exitsRes.data);
      setEntryLogs(entriesRes.data);
    } catch (error) {
      console.error('Failed to fetch gate operations analytics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateAnalytics();
  }, []);

  const downloadExitsExcel = () => {
    if (!exitLogs.length) return;
    const worksheet = XLSX.utils.json_to_sheet(exitLogs.map(log => ({
      StudentName: log.student?.name || 'N/A',
      RollNumber: log.student?.rollNumber || 'N/A',
      Hostel: log.student?.hostel || 'N/A',
      RoomNumber: log.student?.roomNo || 'N/A',
      Action: log.action,
      GateName: log.gateName || 'N/A',
      ScanTime: new Date(log.scanTime).toLocaleString(),
      DeviceID: log.deviceId || 'N/A',
      IPAddress: log.ipAddress || 'N/A'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TodayExits");
    XLSX.writeFile(workbook, "Today_Gate_Exits.xlsx");
  };

  const downloadEntriesExcel = () => {
    if (!entryLogs.length) return;
    const worksheet = XLSX.utils.json_to_sheet(entryLogs.map(log => ({
      StudentName: log.student?.name || 'N/A',
      RollNumber: log.student?.rollNumber || 'N/A',
      Hostel: log.student?.hostel || 'N/A',
      RoomNumber: log.student?.roomNo || 'N/A',
      Action: log.action,
      GateName: log.gateName || 'N/A',
      ScanTime: new Date(log.scanTime).toLocaleString(),
      DeviceID: log.deviceId || 'N/A',
      IPAddress: log.ipAddress || 'N/A'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TodayEntries");
    XLSX.writeFile(workbook, "Today_Gate_Entries.xlsx");
  };

  const downloadOutsideExcel = () => {
    if (!stats?.outsideStudentsList?.length) return;
    const worksheet = XLSX.utils.json_to_sheet(stats.outsideStudentsList.map(s => ({
      RollNumber: s.rollNumber || 'N/A',
      Name: s.user?.name || 'N/A',
      Email: s.user?.email || 'N/A',
      Phone: s.user?.phone || 'N/A',
      Hostel: s.hostel ? s.hostel.name : 'Unknown',
      RoomNumber: s.roomNo || 'N/A',
      Branch: s.branch || 'N/A',
      Year: s.year ? `${s.year} Year` : 'N/A',
      ParentName: s.parentName || 'N/A',
      ParentPhone: s.parentPhone || 'N/A',
      ParentEmail: s.parentEmail || 'N/A'
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "StudentsOutside");
    XLSX.writeFile(workbook, "Students_Outside_Campus.xlsx");
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Gate Operations Analytics</h2>
        <p className="text-muted-foreground">Monitor peak hours, scan statistics, and active off-campus resident logs.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading stats...</div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Exits Card */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Exits</p>
                  {exitLogs.length > 0 && (
                    <button 
                      onClick={downloadExitsExcel}
                      className="p-1.5 bg-rose-600/10 hover:bg-rose-600 hover:text-white rounded-md text-rose-600 transition-all shadow-sm"
                      title="Download Today Exits Excel"
                    >
                      <Download size={12} />
                    </button>
                  )}
                </div>
                <p className="text-4xl font-extrabold mt-2 text-rose-600">{exitLogs.length}</p>
              </div>
              <div className="mt-4 text-xs text-rose-600 flex items-center gap-1.5 font-medium">
                <LogOut size={12} className="rotate-180" /> Scanned out of campus
              </div>
            </div>

            {/* Entries Card */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Today's Returns</p>
                  {entryLogs.length > 0 && (
                    <button 
                      onClick={downloadEntriesExcel}
                      className="p-1.5 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white rounded-md text-emerald-600 transition-all shadow-sm"
                      title="Download Today Entries Excel"
                    >
                      <Download size={12} />
                    </button>
                  )}
                </div>
                <p className="text-4xl font-extrabold mt-2 text-emerald-600">{entryLogs.length}</p>
              </div>
              <div className="mt-4 text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                <LogIn size={12} /> Scanned back inside campus
              </div>
            </div>

            {/* Active Outside Card */}
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Students Outside</p>
                  {stats.outsideStudents > 0 && (
                    <button 
                      onClick={downloadOutsideExcel}
                      className="p-1.5 bg-primary/10 hover:bg-primary hover:text-white rounded-md text-primary transition-all shadow-sm"
                      title="Download Students Outside Excel"
                    >
                      <Download size={12} />
                    </button>
                  )}
                </div>
                <p className="text-4xl font-extrabold mt-2 text-primary">{stats.outsideStudents}</p>
              </div>
              <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                Residents currently checked out
              </div>
            </div>

          </div>

          <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-80">
            <div className="flex gap-2 items-center mb-4">
              <BarChart3 className="text-primary" size={20} />
              <h3 className="font-bold text-foreground">Peak Gate Scan Activity (Hourly)</h3>
            </div>
            {stats.gateActivity && stats.gateActivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.gateActivity}>
                  <XAxis dataKey="_id" tickFormatter={(val) => `${val}:00`} />
                  <YAxis />
                  <Tooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-xs italic">
                No gate traffic recorded today.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">Failed to load gate analytics.</div>
      )}
    </motion.div>
  );
};

export default MainGateAnalytics;
