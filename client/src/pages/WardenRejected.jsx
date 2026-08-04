import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { XCircle, FileText, Download } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

const WardenRejected = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);

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
      RejectionRemarks: p.remarks || 'No remarks provided',
      Status: p.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RejectedPasses");
    XLSX.writeFile(workbook, "Rejected_Gate_Passes.xlsx");
  };

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/pass');
      setPasses(data.filter(p => p.status === 'Rejected'));
    } catch (error) {
      console.error('Error fetching rejected passes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">Rejected Passes</h2>
          <p className="text-muted-foreground">List of rejected student gate passes and recorded rejection remarks.</p>
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
          <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Rejected Pass History</h3>
            <span className="bg-destructive text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {passes.length} Rejected
            </span>
          </div>

          {passes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <XCircle className="opacity-20 text-muted-foreground" size={48} />
              <p>No rejected passes records found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Student Details</th>
                    <th className="px-6 py-3">Type & Destination</th>
                    <th className="px-6 py-3">Proposed Timings</th>
                    <th className="px-6 py-3 text-right">Remarks</th>
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
                      <td className="px-6 py-4 text-right text-xs text-destructive font-medium italic">
                        {pass.remarks || 'No remarks provided'}
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

export default WardenRejected;
