import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, FileText } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const WardenPending = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [remarks, setRemarks] = useState('');
  const { socket } = useSocket();

  const fetchPasses = async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get('/pass');
      setPasses(data.filter(p => p.status === 'Pending'));
    } catch (error) {
      console.error('Error fetching passes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  useEffect(() => {
    if (socket) {
      const handlePassDeleted = (data) => {
        setPasses(prev => prev.filter(p => p._id !== data.passId));
        if (selectedPass && selectedPass._id === data.passId) {
          setSelectedPass(null);
        }
      };
      socket.on('pass_deleted', handlePassDeleted);
      return () => {
        socket.off('pass_deleted', handlePassDeleted);
      };
    }
  }, [socket, selectedPass]);

  const handleAction = async (action) => {
    if (!selectedPass) return;
    try {
      await axiosInstance.put(`/pass/${selectedPass._id}/${action}`, { remarks });
      setPasses(passes.filter(p => p._id !== selectedPass._id));
      setSelectedPass(null);
      setRemarks('');
      toast.success(`Pass ${action}ed successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} pass request.`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Pending Gate Passes</h2>
        <p className="text-muted-foreground">Review and decide on outgoing student pass requests.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading passes...</div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-semibold text-lg">Requests Awaiting Review</h3>
            <span className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">
              {passes.length} Pending
            </span>
          </div>

          {passes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Check className="opacity-20 text-emerald-500" size={48} />
              <p>No pending pass requests.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Student Details</th>
                    <th className="px-6 py-3">Type & Destination</th>
                    <th className="px-6 py-3">Timings</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {passes.map((pass) => (
                    <tr key={pass._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-medium">
                        <div className="text-foreground font-bold">{pass.studentId?.name || 'Unknown Student'}</div>
                        <div className="text-xs text-muted-foreground">{pass.studentProfile?.rollNumber || 'N/A'} • Room {pass.studentProfile?.roomNo || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold">{pass.purpose}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={pass.destination || pass.reason}>
                          {pass.destination || pass.reason}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div><span className="text-muted-foreground">Out:</span> {format(new Date(pass.leaveDate), 'dd MMM, HH:mm')}</div>
                        <div><span className="text-muted-foreground">In:</span> {format(new Date(pass.returnDate), 'dd MMM, HH:mm')}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedPass(pass)}
                          className="px-3.5 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-xs shadow-sm"
                        >
                          Review Request
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

      {/* Review Modal */}
      <AnimatePresence>
        {selectedPass && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card p-6 rounded-2xl shadow-2xl max-w-lg w-full relative border border-border"
            >
              <button onClick={() => setSelectedPass(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-primary mb-4 border-b border-border pb-2">Review Pass Request</h3>

              <div className="space-y-4 text-sm mb-6 max-h-[55vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Student Name</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedPass.studentId?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Roll Number</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedPass.studentProfile?.rollNumber || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Hostel & Room</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {selectedPass.studentProfile?.hostel || 'N/A'} (Room {selectedPass.studentProfile?.roomNo || 'N/A'})
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Branch & Year</p>
                    <p className="font-bold text-foreground mt-0.5">
                      {selectedPass.studentProfile?.branch || 'N/A'} ({selectedPass.studentProfile?.year ? `${selectedPass.studentProfile.year} Year` : 'N/A'})
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Student Email</p>
                    <p className="font-bold text-foreground mt-0.5 truncate">{selectedPass.studentId?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Student Phone</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedPass.studentId?.phone || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <p className="text-xs font-bold text-primary mb-2">Emergency & Parent Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Parent Name</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedPass.studentProfile?.parentName || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Parent Phone</p>
                      <p className="font-bold text-foreground mt-0.5 text-primary">
                        {selectedPass.studentProfile?.parentPhone ? (
                          <a href={`tel:${selectedPass.studentProfile.parentPhone}`} className="hover:underline flex items-center gap-1">
                            📞 {selectedPass.studentProfile.parentPhone}
                          </a>
                        ) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Parent Email</p>
                    <p className="font-bold text-foreground mt-0.5">{selectedPass.studentProfile?.parentEmail || 'N/A'}</p>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3">
                  <p className="text-xs font-bold text-primary mb-2">Pass Details</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Destination</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedPass.destination || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Reason</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedPass.reason || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Departure</p>
                      <p className="font-bold text-foreground mt-0.5">{format(new Date(selectedPass.leaveDate), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold uppercase">Expected Return</p>
                      <p className="font-bold text-foreground mt-0.5">{format(new Date(selectedPass.returnDate), 'dd MMM yyyy, HH:mm')}</p>
                    </div>
                  </div>
                </div>

                {/* Visual Identity & Proof Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border/60 pt-3">
                  {selectedPass.studentId?.photo && (
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Profile Photo</p>
                      <div className="rounded-xl overflow-hidden border border-border bg-white h-24 w-full">
                        <img 
                          src={selectedPass.studentId.photo.startsWith('http') ? selectedPass.studentId.photo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${selectedPass.studentId.photo.replace(/\\/g, '/')}`} 
                          alt="Student Profile" 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                  )}

                  {selectedPass.studentProfile?.idCard && (
                    <div>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">ID Card Proof</p>
                      <a 
                        href={selectedPass.studentProfile.idCard.startsWith('http') ? selectedPass.studentProfile.idCard : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${selectedPass.studentProfile.idCard.replace(/\\/g, '/')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block group relative overflow-hidden rounded-xl border border-border cursor-zoom-in h-24 bg-white"
                      >
                        <img 
                          src={selectedPass.studentProfile.idCard.startsWith('http') ? selectedPass.studentProfile.idCard : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${selectedPass.studentProfile.idCard.replace(/\\/g, '/')}`} 
                          alt="ID Card Proof" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[8px] uppercase">
                          Inspect ID Card
                        </div>
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5 pt-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Decision Remarks (Optional)</label>
                  <input
                    type="text"
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Provide notes or grounds for rejection/approval..."
                    className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => handleAction('reject')}
                  className="flex-1 py-2.5 border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-bold rounded-lg transition-colors text-sm shadow-sm"
                >
                  Reject Pass
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  className="flex-[2] py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors text-sm shadow-md flex items-center justify-center gap-1.5"
                >
                  <Check size={16} /> Approve Pass
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default WardenPending;
