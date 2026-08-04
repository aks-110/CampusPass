import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Search, FileText, Download } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const MainGateEntries = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredLogs.map(log => ({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "EntriesLog");
    XLSX.writeFile(workbook, "Today_Gate_Entries_List.xlsx");
  };

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/gate/logs?action=Return');
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch entries:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const filteredLogs = logs.filter(log =>
    log.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">Today's Returns</h2>
          <p className="text-muted-foreground">List of students who returned to campus through the gates today.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
        >
          <Download size={18} /> Export List (Excel)
        </button>
      </div>

      <div className="flex bg-card p-4 border border-border rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by student name or roll number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full pl-10 pr-4 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading entries...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Inward Scans Today</h3>
            <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <LogIn size={12} /> {filteredLogs.length} Checked In
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <FileText size={48} className="opacity-20 text-muted-foreground" />
              <p>No entry records found for today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Roll Number & Room</th>
                    <th className="px-6 py-3">Hostel</th>
                    <th className="px-6 py-3">Gate</th>
                    <th className="px-6 py-3 text-right">Return Log Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredLogs.map(log => (
                    <tr key={log._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{log.student.name}</td>
                      <td className="px-6 py-4">{log.student.rollNumber} (Room {log.student.roomNo})</td>
                      <td className="px-6 py-4">{log.student.hostel}</td>
                      <td className="px-6 py-4 font-semibold text-foreground">{log.gateName || 'N/A'}</td>
                      <td className="px-6 py-4 text-right font-bold text-emerald-600">
                        {format(new Date(log.scanTime), 'HH:mm:ss')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default MainGateEntries;
