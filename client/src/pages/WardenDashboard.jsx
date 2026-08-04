import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Check, X, Users, Image as ImageIcon, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const WardenDashboard = () => {
  const [activeTab, setActiveTab] = useState('Registrations'); // Registrations | Passes
  
  // Registration State
  const [pendingStudents, setPendingStudents] = useState([]);
  const [selectedIdCard, setSelectedIdCard] = useState(null);
  
  // Pass State
  const [passes, setPasses] = useState([]);
  
  const [loading, setLoading] = useState(true);

  const exportRegistrations = () => {
    const worksheet = XLSX.utils.json_to_sheet(pendingStudents.map(s => ({
      RollNumber: s.rollNumber || 'N/A',
      Name: s.name,
      Email: s.email,
      Phone: s.phone || 'N/A',
      Hostel: s.hostel || 'N/A',
      RoomNumber: s.roomNo || 'N/A',
      Branch: s.branch || 'N/A',
      Year: s.year ? `${s.year} Year` : 'N/A',
      ParentName: s.parentName || 'N/A',
      ParentPhone: s.parentPhone || 'N/A',
      ParentEmail: s.parentEmail || 'N/A',
      AppliedDate: new Date(s.createdAt || Date.now()).toLocaleDateString()
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PendingRegistrations");
    XLSX.writeFile(workbook, "Pending_Registrations.xlsx");
  };

  const exportPasses = () => {
    const worksheet = XLSX.utils.json_to_sheet(passes.map(p => ({
      PassID: p.id || p._id,
      StudentName: p.studentId?.name || p.student?.name || 'N/A',
      RollNumber: p.studentProfile?.rollNumber || 'N/A',
      Hostel: p.studentProfile?.hostel || 'N/A',
      RoomNumber: p.studentProfile?.roomNo || 'N/A',
      PassType: p.purpose || 'N/A',
      Destination: p.destination || p.reason || 'N/A',
      DepartureTime: new Date(p.leaveDate).toLocaleString(),
      ExpectedReturnTime: new Date(p.returnDate).toLocaleString(),
      Reason: p.reason || 'N/A',
      Status: p.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PendingPasses");
    XLSX.writeFile(workbook, "Pending_Gate_Passes.xlsx");
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Registrations') {
        const { data } = await axiosInstance.get('/admin/pending-users');
        setPendingStudents(data);
      } else {
        const { data } = await axiosInstance.get('/pass');
        // Filter out passes that are not pending (or show all, but we mainly care about pending)
        setPasses(data.filter(p => p.status === 'Pending'));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const handleRegistrationAction = async (userId, action) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/${action}`);
      setPendingStudents(pendingStudents.filter(user => user._id !== userId));
      toast.success(`Student ${action}ed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} student.`);
    }
  };

  const handlePassAction = async (passId, action) => {
    try {
      await axiosInstance.put(`/pass/${passId}/${action}`, { remarks: `Automatically ${action} by Warden` });
      setPasses(passes.filter(p => p._id !== passId));
      toast.success(`Pass ${action}ed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} pass.`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Warden Control Center</h2>
        <p className="text-muted-foreground">Manage student registrations and gate pass requests for your assigned hostel.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-secondary/20 p-1 rounded-lg w-fit">
        {['Registrations', 'Passes'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${
              activeTab === tab 
                ? 'bg-primary text-primary-foreground shadow' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'Registrations' ? <Users size={16} /> : <FileText size={16} />}
            {tab === 'Registrations' ? 'Account Approvals' : 'Pass Requests'}
            
            {/* Notification Badge */}
            {tab === 'Registrations' && pendingStudents.length > 0 && activeTab !== tab && (
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            )}
            {tab === 'Passes' && passes.length > 0 && activeTab !== tab && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl">Loading Data...</div>
      ) : activeTab === 'Registrations' ? (
        
        /* REGISTRATION TAB CONTENT */
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-semibold text-lg">Pending Student Registrations</h3>
            <div className="flex items-center gap-2">
              {pendingStudents.length > 0 && (
                <button 
                  onClick={exportRegistrations}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm"
                >
                  <Download size={12} /> Export Excel
                </button>
              )}
              <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                {pendingStudents.length} Requests
              </span>
            </div>
          </div>

          {pendingStudents.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Check size={48} className="opacity-20 text-emerald-500" />
              <p>All students in your hostel are verified.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Student Details</th>
                    <th className="px-6 py-3">Academics & Room</th>
                    <th className="px-6 py-3 text-center">ID Card</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div>{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.rollNumber} • {student.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div>Room {student.room}</div>
                        <div className="text-xs text-muted-foreground">{student.branch} ({student.year} Year)</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {student.idCardUrl ? (
                          <button 
                            onClick={() => setSelectedIdCard(student.idCardUrl.startsWith('http') ? student.idCardUrl : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${student.idCardUrl.replace(/\\/g, '/')}`)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground rounded-md transition-colors text-xs font-semibold"
                          >
                            <ImageIcon size={14} /> View ID
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">No ID</span>
                        )}
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button onClick={() => handleRegistrationAction(student._id, 'approve')} className="px-3 py-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white font-medium rounded-md transition-all">
                          Approve
                        </button>
                        <button onClick={() => handleRegistrationAction(student._id, 'reject')} className="px-3 py-1 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-medium rounded-md transition-all">
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      ) : (

        /* PASSES TAB CONTENT */
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-semibold text-lg">Pending Pass Requests</h3>
            <div className="flex items-center gap-2">
              {passes.length > 0 && (
                <button 
                  onClick={exportPasses}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-sm"
                >
                  <Download size={12} /> Export Excel
                </button>
              )}
              <span className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {passes.length} Requests
              </span>
            </div>
          </div>

          {passes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Check size={48} className="opacity-20 text-emerald-500" />
              <p>No pending pass requests at the moment.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Type & Dest</th>
                    <th className="px-6 py-3">Timings</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {passes.map((pass) => (
                    <tr key={pass._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="font-bold text-foreground">{pass.studentId?.name || pass.student?.name || 'Unknown'}</div>
                        <div className="text-xs text-muted-foreground">{pass.studentProfile?.rollNumber || 'N/A'} • Room {pass.studentProfile?.roomNo || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{pass.purpose}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={pass.destination || pass.reason}>
                          {pass.destination || pass.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs"><span className="text-muted-foreground">Out:</span> {format(new Date(pass.leaveDate), "dd MMM, HH:mm")}</div>
                        <div className="text-xs"><span className="text-muted-foreground">In:</span> {format(new Date(pass.returnDate), "dd MMM, HH:mm")}</div>
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button onClick={() => handlePassAction(pass._id, 'approve')} className="px-3 py-1 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white font-medium rounded-md transition-all">
                          Approve
                        </button>
                        <button onClick={() => handlePassAction(pass._id, 'reject')} className="px-3 py-1 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-medium rounded-md transition-all">
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ID Card Modal */}
      <AnimatePresence>
        {selectedIdCard && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedIdCard(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card p-2 rounded-xl shadow-2xl max-w-2xl w-full relative"
            >
              <button onClick={() => setSelectedIdCard(null)} className="absolute -top-10 right-0 p-2 text-white hover:text-gray-300">
                <X size={24} />
              </button>
              <img src={selectedIdCard} alt="Student ID Card" className="w-full h-auto rounded-lg object-contain max-h-[80vh]" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WardenDashboard;
