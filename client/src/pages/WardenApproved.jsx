import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText, Download } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import * as XLSX from 'xlsx';

const WardenApproved = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { socket } = useSocket();

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(passes.map(p => ({
      PassID: p.id || p._id,
      StudentName: p.studentId?.name || 'N/A',
      RollNumber: p.studentProfile?.rollNumber || p.student?.rollNumber || 'N/A',
      Hostel: p.studentProfile?.hostel || p.student?.hostel || 'N/A',
      RoomNumber: p.studentProfile?.roomNo || p.student?.roomNo || 'N/A',
      PassType: p.purpose || 'N/A',
      Destination: p.destination || p.reason || 'N/A',
      DepartureTime: new Date(p.leaveDate).toLocaleString(),
      ExpectedReturnTime: new Date(p.returnDate).toLocaleString(),
      ExitTime: p.exitTime ? new Date(p.exitTime).toLocaleString() : 'N/A',
      ExitGate: p.exitGate || 'N/A',
      EntryTime: p.entryTime ? new Date(p.entryTime).toLocaleString() : 'N/A',
      EntryGate: p.entryGate || 'N/A',
      Status: p.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ApprovedPasses");
    XLSX.writeFile(workbook, "Approved_Gate_Passes.xlsx");
  };

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/pass');
      setPasses(data.filter(p => ['Approved', 'Completed'].includes(p.status)));
    } catch (error) {
      console.error('Error fetching approved passes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNotification = (data) => {
        if (data.title === 'Student Movement') {
          fetchPasses();
        }
      };
      socket.on('notification', handleNotification);
      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">Approved Gate Passes</h2>
          <p className="text-muted-foreground">List of active approved passes and successfully completed student movements.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
        >
          <Download size={18} /> Export to Excel
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading passes...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-semibold text-lg">Approved movements</h3>
            <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {passes.length} Passes
            </span>
          </div>

          {passes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <ShieldCheck className="opacity-20 text-muted-foreground" size={48} />
              <p>No approved passes records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Student Details</th>
                    <th className="px-6 py-3">Type & Destination</th>
                    <th className="px-6 py-3">Timings</th>
                    <th className="px-6 py-3">Logs</th>
                    <th className="px-6 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {passes.map((pass) => (
                    <tr key={pass._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="text-foreground font-bold">{pass.studentId?.name || 'Unknown Student'}</div>
                        <div className="text-xs text-muted-foreground">{pass.studentId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{pass.purpose}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{pass.destination || pass.reason}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div><span className="text-muted-foreground">Out:</span> {format(new Date(pass.leaveDate), 'dd MMM, HH:mm')}</div>
                        <div><span className="text-muted-foreground">In:</span> {format(new Date(pass.returnDate), 'dd MMM, HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {pass.exitTime && <div>Exit: {format(new Date(pass.exitTime), 'HH:mm')} {pass.exitGate && <span className="text-[10px] bg-secondary text-secondary-foreground px-1 py-0.5 rounded font-semibold">({pass.exitGate})</span>}</div>}
                        {pass.entryTime && <div>Entry: {format(new Date(pass.entryTime), 'HH:mm')} {pass.entryGate && <span className="text-[10px] bg-secondary text-secondary-foreground px-1 py-0.5 rounded font-semibold">({pass.entryGate})</span>}</div>}
                        {!pass.exitTime && !pass.entryTime && <span className="italic text-xs text-muted-foreground">Unscanned</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`px-2 py-1 border rounded-md text-[10px] font-bold uppercase tracking-wider ${pass.status === 'Completed' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-emerald-100 text-emerald-700 border-emerald-200'}`}>
                          {pass.status}
                        </span>
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

export default WardenApproved;
