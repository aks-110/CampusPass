import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, FileText, Phone, MapPin, Calendar, User, Users } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const WardenRequests = () => {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/admin/pending-users');
      setPendingStudents(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (userId, action) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/${action}`);
      setPendingStudents(pendingStudents.filter(user => user._id !== userId));
      setSelectedRequest(null);
    } catch (error) {
      alert(`Failed to ${action} student.`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Registration Requests</h2>
        <p className="text-muted-foreground">Verify and approve student registrations for your hostel.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading requests...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Pending student applications</h3>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingStudents.length} Pending
            </span>
          </div>

          {pendingStudents.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Users size={48} className="opacity-20 text-muted-foreground" />
              <p>No registration requests found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Student Details</th>
                    <th className="px-6 py-3">Academic Info</th>
                    <th className="px-6 py-3">Hostel Details</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pendingStudents.map((student) => (
                    <tr key={student._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="text-foreground font-bold">{student.name}</div>
                        <div className="text-xs text-muted-foreground">{student.email}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div className="font-semibold text-foreground">{student.rollNumber}</div>
                        <div>{student.branch} ({student.year} Year)</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        <div className="font-semibold text-foreground">{student.hostel}</div>
                        <div>Room {student.roomNo || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedRequest(student)}
                          className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 font-bold rounded-lg text-xs shadow-sm"
                        >
                          Review details
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

      {/* Unified Verification Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card p-6 rounded-2xl shadow-2xl max-w-lg w-full relative border border-border overflow-y-auto max-h-[90vh]"
            >
              <button onClick={() => setSelectedRequest(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-primary mb-4 border-b border-border pb-2">Verify Student Profile</h3>

              <div className="space-y-4 text-sm mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Student Name</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Roll Number</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedRequest.rollNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Branch</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedRequest.branch}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Year</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedRequest.year} Year</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Hostel Assigned</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedRequest.hostel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Room Number</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedRequest.roomNo || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Email</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Phone Number</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedRequest.phone || 'N/A'}</p>
                  </div>
                </div>

                {/* Parent Information Section */}
                <div className="border-t border-border pt-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Emergency Contacts</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Parent/Guardian</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedRequest.parentName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Parent Phone</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedRequest.parentPhone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Visual Identity & Proof Cards */}
                <div className="grid grid-cols-2 gap-4 border-t border-border pt-3">
                  {selectedRequest.photo && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase mb-1.5">Profile Picture</p>
                      <div className="rounded-xl overflow-hidden border border-border bg-white h-28 w-full">
                        <img 
                          src={selectedRequest.photo.startsWith('http') ? selectedRequest.photo : `http://localhost:5000/${selectedRequest.photo.replace(/\\/g, '/')}`} 
                          alt="Student Profile" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                  )}

                  {selectedRequest.idCard && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase mb-1.5">Uploaded ID Card</p>
                      <a 
                        href={selectedRequest.idCard.startsWith('http') ? selectedRequest.idCard : `http://localhost:5000/${selectedRequest.idCard.replace(/\\/g, '/')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block group relative overflow-hidden rounded-xl border border-border cursor-zoom-in h-28 bg-white"
                      >
                        <img 
                          src={selectedRequest.idCard.startsWith('http') ? selectedRequest.idCard : `http://localhost:5000/${selectedRequest.idCard.replace(/\\/g, '/')}`} 
                          alt="Student ID Card" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[9px] uppercase">
                          Inspect ID Card
                        </div>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleAction(selectedRequest._id, 'reject')}
                  className="flex-1 py-2.5 border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-bold rounded-lg transition-colors text-sm shadow-sm"
                >
                  Reject Student
                </button>
                <button
                  onClick={() => handleAction(selectedRequest._id, 'approve')}
                  className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-sm shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Approve Registration
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WardenRequests;
