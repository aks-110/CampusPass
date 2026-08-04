import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3, Users, FileText, ArrowRight, Download } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import * as XLSX from 'xlsx';

const WardenAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const downloadUnverified = () => {
    if (!stats?.pendingApprovalsList) return;
    const worksheet = XLSX.utils.json_to_sheet(stats.pendingApprovalsList.map(s => ({
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
    XLSX.utils.book_append_sheet(workbook, worksheet, "Unverified");
    XLSX.writeFile(workbook, "Awaiting_Registrations.xlsx");
  };

  const downloadPassesToday = () => {
    if (!stats?.passesTodayList) return;
    const worksheet = XLSX.utils.json_to_sheet(stats.passesTodayList.map(p => ({
      PassID: p.id || p._id,
      StudentName: p.student?.name || 'N/A',
      RollNumber: p.studentProfile?.rollNumber || 'N/A',
      Hostel: p.studentProfile?.hostel || 'N/A',
      RoomNumber: p.studentProfile?.roomNo || 'N/A',
      PassType: p.purpose || 'N/A',
      Destination: p.destination || p.reason || 'N/A',
      DepartureTime: new Date(p.leaveDate).toLocaleString(),
      ExpectedReturnTime: new Date(p.returnDate).toLocaleString(),
      ExitTime: p.exitTime ? new Date(p.exitTime).toLocaleString() : 'Not Checked Out Yet',
      EntryTime: p.entryTime ? new Date(p.entryTime).toLocaleString() : 'Not Returned Yet',
      ExitGate: p.exitGate || 'N/A',
      EntryGate: p.entryGate || 'N/A',
      Status: p.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PassesToday");
    XLSX.writeFile(workbook, "Passes_Issued_Today.xlsx");
  };

  const downloadOutsideStudents = () => {
    if (!stats?.outsideStudentsList) return;
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

  const fetchStats = async () => {
    try {
      const { data } = await axiosInstance.get('/reports/stats');
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch warden analytics', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Hostel Analytics</h2>
        <p className="text-muted-foreground">Monitor peak hours, active passes, and hostel residency statistics.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading stats...</div>
      ) : stats ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Unverified Accounts</p>
                  {stats.pendingApprovals > 0 && (
                    <button 
                      onClick={downloadUnverified}
                      className="p-1.5 bg-primary/10 hover:bg-primary hover:text-white rounded-md text-primary transition-all shadow-sm"
                      title="Download Excel List"
                    >
                      <Download size={12} />
                    </button>
                  )}
                </div>
                <p className="text-4xl font-extrabold mt-2 text-primary">{stats.pendingApprovals}</p>
              </div>
              <div className="mt-4 text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                Students awaiting validation
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Passes Approved Today</p>
                  {stats.passesToday > 0 && (
                    <button 
                      onClick={downloadPassesToday}
                      className="p-1.5 bg-emerald-600/10 hover:bg-emerald-600 hover:text-white rounded-md text-emerald-600 transition-all shadow-sm"
                      title="Download Excel List"
                    >
                      <Download size={12} />
                    </button>
                  )}
                </div>
                <p className="text-4xl font-extrabold mt-2 text-emerald-600">{stats.passesToday}</p>
              </div>
              <div className="mt-4 text-xs text-emerald-600 flex items-center gap-1.5 font-medium">
                Active student departures logged
              </div>
            </div>

            <div className="bg-card border border-border p-6 rounded-xl shadow-sm flex flex-col justify-between min-h-[160px]">
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Residents Currently Outside</p>
                  {stats.outsideStudents > 0 && (
                    <button 
                      onClick={downloadOutsideStudents}
                      className="p-1.5 bg-rose-600/10 hover:bg-rose-600 hover:text-white rounded-md text-rose-600 transition-all shadow-sm"
                      title="Download Excel List"
                    >
                      <Download size={12} />
                    </button>
                  )}
                </div>
                <p className="text-4xl font-extrabold mt-2 text-rose-600">{stats.outsideStudents}</p>
              </div>
              <div className="mt-4 text-xs text-rose-600 flex items-center gap-1.5 font-semibold animate-pulse">
                Awaiting gate scanners returns
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-80">
            <div className="flex gap-2 items-center mb-4">
              <BarChart3 className="text-primary" size={20} />
              <h3 className="font-bold text-foreground">Peak Gate Activity (Hourly)</h3>
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
                No gate scan traffic recorded today yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">Failed to load analytics dashboard.</div>
      )}
    </motion.div>
  );
};

export default WardenAnalytics;
