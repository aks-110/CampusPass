import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Calendar, BarChart3, AlertTriangle, Users } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const AdminReports = () => {
  const [loadingReport, setLoadingReport] = useState('');

  const downloadReport = async (reportType) => {
    setLoadingReport(reportType);
    try {
      // 1. Fetch pass data
      const { data } = await axiosInstance.get('/pass');
      let filteredData = [];
      let filename = '';

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      switch (reportType) {
        case 'daily':
          filteredData = data.filter(p => new Date(p.createdAt) >= today);
          filename = 'Daily_Passes_Report';
          break;
        case 'monthly':
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          filteredData = data.filter(p => new Date(p.createdAt) >= thirtyDaysAgo);
          filename = 'Monthly_Passes_Report';
          break;
        case 'rejected':
          filteredData = data.filter(p => p.status === 'Rejected');
          filename = 'Rejected_Passes_Report';
          break;
        case 'late':
          filteredData = data.filter(p => 
            p.status === 'Approved' && 
            new Date() > new Date(p.returnDate) && 
            !p.entryTime
          );
          filename = 'Late_Returns_Report';
          break;
        case 'outside':
          filteredData = data.filter(p => p.status === 'Approved' && p.exitTime && !p.entryTime);
          filename = 'Students_Outside_Report';
          break;
        default:
          filteredData = data;
          filename = 'All_Passes_Report';
      }

      // 2. Format data for Excel
      const reportRows = filteredData.map((pass, idx) => ({
        'S.No': idx + 1,
        'Student Name': pass.studentId?.name || 'N/A',
        'Student Email': pass.studentId?.email || 'N/A',
        'Purpose': pass.purpose || 'N/A',
        'Destination': pass.destination || 'N/A',
        'Leave Date': pass.leaveDate ? new Date(pass.leaveDate).toLocaleString() : 'N/A',
        'Expected Return Date': pass.returnDate ? new Date(pass.returnDate).toLocaleString() : 'N/A',
        'Exit Log Time': pass.exitTime ? new Date(pass.exitTime).toLocaleString() : 'N/A',
        'Exit Gate': pass.exitGate || 'N/A',
        'Entry Log Time': pass.entryTime ? new Date(pass.entryTime).toLocaleString() : 'N/A',
        'Entry Gate': pass.entryGate || 'N/A',
        'Status': pass.status
      }));

      // 3. Export to Excel Sheet
      const worksheet = XLSX.utils.json_to_sheet(reportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');
      XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Report downloaded successfully');

    } catch (error) {
      console.error('Failed to download report', error);
      toast.error('Error downloading report files.');
    } finally {
      setLoadingReport('');
    }
  };

  const reports = [
    { id: 'daily', title: 'Daily Passes', desc: 'Passes applied, approved, or scanned during the last 24 hours.', icon: <Calendar className="text-blue-500" size={24} /> },
    { id: 'monthly', title: 'Monthly Passes', desc: 'Historical pass volumes and metrics for the past 30 days.', icon: <BarChart3 className="text-emerald-500" size={24} /> },
    { id: 'rejected', title: 'Rejected Passes', desc: 'Review rejection reasons and statistics across wardens.', icon: <AlertTriangle className="text-amber-500" size={24} /> },
    { id: 'late', title: 'Late Returns', desc: 'Identify students who have exceeded their approved return times.', icon: <AlertTriangle className="text-rose-500 animate-pulse" size={24} /> },
    { id: 'outside', title: 'Students Outside', desc: 'Real-time catalog of residents currently outside the gates.', icon: <Users className="text-purple-500" size={24} /> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-primary">System Reports & Exports</h2>
        <p className="text-muted-foreground">Extract logs and download production spreadsheet audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reports.map((rep) => (
          <div key={rep.id} className="bg-card border border-border p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4 items-start">
              <div className="p-3 bg-secondary/10 rounded-xl shrink-0">
                {rep.icon}
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground">{rep.title}</h3>
                <p className="text-xs text-muted-foreground">{rep.desc}</p>
              </div>
            </div>
            <button
              onClick={() => downloadReport(rep.id)}
              disabled={loadingReport === rep.id}
              className="w-full py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Download size={14} />
              {loadingReport === rep.id ? 'Exporting Spreadsheet...' : 'Download Excel Report'}
            </button>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default AdminReports;
