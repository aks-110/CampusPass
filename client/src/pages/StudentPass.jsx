import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FilePlus, QrCode as QrIcon, Clock, ShieldCheck, MapPin, X, Copy, Check } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../utils/axiosInstance';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const StudentPass = () => {
  const { user } = useSelector((state) => state.auth);
  const [activePass, setActivePass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const { socket } = useSocket();

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm();
  const selectedPassType = watch('passType');
  const leaveDateVal = watch('leaveDate');
  const leaveTimeVal = watch('leaveTime');
  const returnDateVal = watch('returnDate');
  const returnTimeVal = watch('returnTime');

  const fetchActivePass = async () => {
    try {
      const { data } = await axiosInstance.get('/pass');
      // Look for the single active gate pass (Pending or Approved)
      const current = data.find(p => ['Pending', 'Approved'].includes(p.status));
      setActivePass(current || null);
    } catch (error) {
      console.error('Failed to fetch passes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePass = async (passId) => {
    if (!window.confirm('Are you sure you want to cancel and delete this pass request?')) return;
    try {
      await axiosInstance.delete(`/pass/${passId}`);
      setActivePass(null);
      toast.success('Pass deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete pass');
    }
  };

  useEffect(() => {
    fetchActivePass();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNotification = (data) => {
        if (['Pass Approved', 'Pass Rejected', 'Gate Scan Successful'].includes(data.title)) {
          fetchActivePass();
        }
      };
      socket.on('notification', handleNotification);
      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket]);

  // Real-time synchronization to ensure Return Date/Time is after Leaving Date/Time
  useEffect(() => {
    if (leaveDateVal && returnDateVal && returnDateVal < leaveDateVal) {
      setValue('returnDate', leaveDateVal);
    }
  }, [leaveDateVal, returnDateVal, setValue]);

  useEffect(() => {
    if (leaveDateVal && returnDateVal && leaveDateVal === returnDateVal && leaveTimeVal && returnTimeVal && returnTimeVal <= leaveTimeVal) {
      setValue('returnTime', '');
    }
  }, [leaveTimeVal, returnTimeVal, leaveDateVal, returnDateVal, setValue]);

  const onSubmit = async (data) => {
    try {
      const departureDate = new Date(`${data.leaveDate}T${data.leaveTime}`);
      const expectedReturnDate = new Date(`${data.returnDate}T${data.returnTime}`);

      const now = new Date();
      // Allow a small 5-minute grace period for current time differences
      now.setMinutes(now.getMinutes() - 5);
      if (departureDate < now) {
        toast.error('Departure date and time cannot be in the past.');
        return;
      }

      if (expectedReturnDate <= departureDate) {
        toast.error('Expected return date and time must be after the departure date and time.');
        return;
      }

      const payload = {
        passType: data.passType,
        reason: data.reason,
        destination: data.destination,
        departureDate,
        expectedReturnDate,
        ...(data.passType === 'Home Leave' && { homeAddress: data.homeAddress, travelMode: data.travelMode })
      };

      await axiosInstance.post('/pass/apply', payload);
      setShowApplyModal(false);
      reset();
      fetchActivePass();
      toast.success('Pass requested successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit gate pass request.');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'Pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      default: return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-primary">Active Gate Pass</h2>
        <p className="text-muted-foreground">Apply for passes and scan outward/inward codes.</p>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading pass state...</div>
      ) : activePass ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Details Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6">
            <div>
              <div className="flex justify-between items-center border-b border-border pb-4">
                <div>
                  <span className={`px-2.5 py-1 border rounded-full text-xs font-bold uppercase tracking-wider ${getStatusStyle(activePass.status)}`}>
                    {activePass.status}
                  </span>
                  <h3 className="text-2xl font-bold text-foreground mt-3">{activePass.purpose || 'Gate Pass'}</h3>
                </div>
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Clock size={24} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm mt-6">
                <div>
                  <p className="text-xs text-muted-foreground font-semibold uppercase">Destination</p>
                  <p className="font-bold text-foreground mt-0.5">{activePass.destination || activePass.reason}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Departure</p>
                    <p className="font-bold text-foreground mt-0.5">{format(new Date(activePass.leaveDate), 'dd MMM, HH:mm')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold uppercase">Expected Return</p>
                    <p className="font-bold text-foreground mt-0.5">{format(new Date(activePass.returnDate), 'dd MMM, HH:mm')}</p>
                  </div>
                </div>

                {(activePass.exitGate || activePass.entryGate) && (
                  <div className="grid grid-cols-2 gap-4 border-t border-border pt-3 mt-1">
                    {activePass.exitGate && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Exit Gate Logged</p>
                        <p className="font-semibold text-foreground mt-0.5 text-xs">{activePass.exitGate}</p>
                      </div>
                    )}
                    {activePass.entryGate && (
                      <div>
                        <p className="text-xs text-muted-foreground font-semibold uppercase">Entry Gate Logged</p>
                        <p className="font-semibold text-foreground mt-0.5 text-xs">{activePass.entryGate}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {activePass.status === 'Pending' && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-700 rounded-xl text-xs flex gap-2.5 items-start">
                  <Clock className="shrink-0 mt-0.5" size={16} />
                  <p>This pass is pending review by your Hostel Warden. You will be notified immediately via email and portal notification when approved.</p>
                </div>
                <button
                  onClick={() => handleDeletePass(activePass._id)}
                  className="w-full py-2.5 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white font-bold rounded-xl transition-all text-xs shadow-sm"
                >
                  Cancel & Delete Request
                </button>
              </div>
            )}
          </div>

          {/* QR Code Container */}
          {activePass.status === 'Approved' ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-4 bg-white rounded-xl shadow-inner border border-gray-100">
                <QRCodeSVG
                  value={`${window.location.origin}/verify-pass?token=${activePass._id}:${activePass.qrToken}`}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-foreground flex items-center justify-center gap-1.5">
                  <ShieldCheck className="text-emerald-500" size={16} /> Ready to Scan
                </p>
                <p className="text-xs text-muted-foreground">Present this QR Code to Main Gate guard or scan to verify.</p>
              </div>

              {/* Manual Pass Token */}
              <div className="w-full pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider text-left">Manual Pass Token</p>
                <div className="mt-1 flex items-center justify-between gap-2 p-2 bg-secondary/10 rounded-lg border border-border">
                  <span className="text-xs font-mono font-semibold truncate text-foreground select-all w-[180px] text-left" title={`${activePass._id}:${activePass.qrToken}`}>
                    {activePass._id}:{activePass.qrToken}
                  </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${activePass._id}:${activePass.qrToken}`);
                        toast.success('Token copied!');
                      }}
                      type="button"
                    className="p-1 hover:bg-secondary/20 rounded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    title="Copy Token"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleDeletePass(activePass._id)}
                className="w-full py-2.5 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white font-bold rounded-xl transition-all text-xs shadow-sm"
              >
                Cancel & Delete Active Pass
              </button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center text-muted-foreground min-h-[300px]">
              <QrIcon size={48} className="opacity-20 mb-4" />
              <p className="text-sm">Pass is not approved yet.<br/>Approved passes show scan-ready QR codes here.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-12 shadow-sm text-center max-w-xl mx-auto space-y-6 flex flex-col items-center">
          <div className="p-4 bg-primary/5 rounded-full text-primary">
            <FilePlus size={48} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">No Active Passes</h3>
            <p className="text-muted-foreground mt-2">You currently have no pending or active gate passes. Apply for a pass to leave the campus.</p>
          </div>
          <button
            onClick={() => setShowApplyModal(true)}
            className="px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 transition-all shadow-md"
          >
            Apply for New Pass
          </button>
        </div>
      )}

      {/* Apply Pass Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-card p-6 rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative border border-border"
            >
              <button onClick={() => setShowApplyModal(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X size={20} />
              </button>

              <h3 className="text-xl font-bold text-primary mb-4 border-b border-border pb-2">New Gate Pass Request</h3>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pass Type</label>
                  <select className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" {...register('passType', { required: true })}>
                    <option value="">Select pass type</option>
                    <option value="Market">Market Pass</option>
                    <option value="Home Leave">Home Leave</option>
                    <option value="Hostel Exit">Other Hostel Visit</option>
                    <option value="Emergency">Emergency Exit</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destination</label>
                  <input type="text" placeholder="Where are you going?" className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" {...register('destination', { required: true })} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leaving Date</label>
                    <input 
                      type="date" 
                      min={new Date().toISOString().split('T')[0]}
                      onClick={(e) => e.target.showPicker()}
                      onFocus={(e) => e.target.showPicker()}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-secondary/5 text-foreground scheme-dark" 
                      {...register('leaveDate', { required: true })} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Leaving Time</label>
                    <input 
                      type="time" 
                      onClick={(e) => e.target.showPicker()}
                      onFocus={(e) => e.target.showPicker()}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-secondary/5 text-foreground scheme-dark" 
                      {...register('leaveTime', { required: true })} 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Date</label>
                    <input 
                      type="date" 
                      min={leaveDateVal || new Date().toISOString().split('T')[0]}
                      onClick={(e) => e.target.showPicker()}
                      onFocus={(e) => e.target.showPicker()}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-secondary/5 text-foreground scheme-dark" 
                      {...register('returnDate', { required: true })} 
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Time</label>
                    <input 
                      type="time" 
                      min={leaveDateVal === returnDateVal ? leaveTimeVal : undefined}
                      onClick={(e) => e.target.showPicker()}
                      onFocus={(e) => e.target.showPicker()}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-secondary/5 text-foreground scheme-dark" 
                      {...register('returnTime', { required: true })} 
                    />
                  </div>
                </div>

                {selectedPassType === 'Home Leave' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 pt-2 border-t border-border">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Home Address</label>
                      <input type="text" className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" {...register('homeAddress')} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Travel Mode (Bus/Train/Flight)</label>
                      <input type="text" className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" {...register('travelMode')} />
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-col gap-1.5 pb-4">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reason for pass</label>
                  <textarea rows={3} className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" {...register('reason', { required: true })} />
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                  {isSubmitting ? 'Submitting...' : 'Submit Request to Warden'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudentPass;
