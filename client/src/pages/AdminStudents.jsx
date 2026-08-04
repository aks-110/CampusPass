import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import * as XLSX from 'xlsx';
import { Search, Download, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

const AdminStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            const res = await axiosInstance.get('/admin/users?role=Student');
            // Just basic User objects for now. A real implementation would join the Student profile.
            setStudents(res.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching students:', error);
            setLoading(false);
        }
    };

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
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
        XLSX.writeFile(workbook, "CampusPass_Students.xlsx");
    };

    const filteredStudents = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground tracking-tight">Student Directory</h1>
                    <p className="text-muted-foreground">Manage and export all registered students.</p>
                </div>
                <button 
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                >
                    <Download size={18} /> Export to Excel
                </button>
            </div>

            <div className="bg-card border border-border p-4 rounded-xl shadow-sm flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search by name or email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="text-muted-foreground" size={18} />
                    <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-secondary border border-border rounded-lg px-4 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Suspended">Suspended</option>
                    </select>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/50 text-muted-foreground uppercase text-xs font-bold">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Academics & Room</th>
                                <th className="px-6 py-4">Parent Details</th>
                                <th className="px-6 py-4">Joined</th>
                                <th className="px-6 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-muted-foreground animate-pulse">Loading students...</td>
                                </tr>
                            ) : filteredStudents.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-8 text-muted-foreground">No students found matching your criteria.</td>
                                </tr>
                            ) : (
                                filteredStudents.map((student, i) => (
                                    <motion.tr 
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                        key={student._id} 
                                        className="hover:bg-secondary/20 transition-colors"
                                    >
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
                                            <div className="font-semibold text-foreground">{student.hostel || 'N/A'} (Room {student.roomNo || 'N/A'})</div>
                                            <div className="text-xs text-muted-foreground">{student.branch || 'N/A'} {student.year ? `(${student.year} Year)` : ''}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            <div>{student.parentName || 'N/A'}</div>
                                            <div className="text-primary font-semibold">{student.parentPhone || 'N/A'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-muted-foreground text-xs">
                                            {new Date(student.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                student.status === 'Active' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                            }`}>
                                                {student.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminStudents;
