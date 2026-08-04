import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Ban, CheckCircle, Users, Download } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

const WardenStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredStudents.map(s => ({
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
      Status: s.status,
      Registered: new Date(s.createdAt).toLocaleDateString()
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HostelStudents");
    XLSX.writeFile(workbook, "Hostel_Residency_Directory.xlsx");
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/admin/users?role=Student');
      setStudents(data);
    } catch (error) {
      console.error('Failed to fetch students', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const toggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await axiosInstance.put(`/admin/users/${userId}/status`, { status: nextStatus });
      setStudents(students.map(u => u._id === userId ? { ...u, status: nextStatus } : u));
      toast.success(`Student status updated to ${nextStatus}`);
    } catch (error) {
      toast.error('Failed to change student status');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary">Registered Students</h2>
          <p className="text-muted-foreground">Manage and audit student residency statuses within your hostel.</p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm text-sm"
        >
          <Download size={18} /> Export to Excel
        </button>
      </div>

      <div className="flex bg-card p-4 border border-border rounded-xl shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by student name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full pl-10 pr-4 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading student directory...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-semibold text-lg">Residency List</h3>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {filteredStudents.length} Students
            </span>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Users className="opacity-20 text-muted-foreground" size={48} />
              <p>No students found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-bold">
                  <tr>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Academics & Room</th>
                    <th className="px-6 py-3">Parent Details</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground flex items-center gap-3">
                        {student.photo ? (
                          <img src={student.photo.startsWith('http') ? student.photo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${student.photo.replace(/\\/g, '/')}`} className="w-8 h-8 rounded-full object-cover shadow-sm border border-border" alt="" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs shadow-sm border border-border">
                            {student.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-foreground">{student.name}</div>
                          <div className="text-xs text-muted-foreground">{student.rollNumber || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">Room {student.roomNo || 'N/A'}</div>
                        <div className="text-xs text-muted-foreground">{student.branch || 'N/A'} {student.year ? `(${student.year} Year)` : ''}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div>{student.parentName || 'N/A'}</div>
                        <div className="text-primary font-semibold">{student.parentPhone || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${student.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => toggleStatus(student._id, student.status)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${student.status === 'Active' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                        >
                          {student.status === 'Active' ? (
                            <>
                              <Ban size={14} /> Suspend Pass Privilege
                            </>
                          ) : (
                            <>
                              <CheckCircle size={14} /> Reactivate Privilege
                            </>
                          )}
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
    </motion.div>
  );
};

export default WardenStudents;
