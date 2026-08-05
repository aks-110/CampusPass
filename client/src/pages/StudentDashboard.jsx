import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, FilePlus, QrCode as QrIcon, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../utils/axiosInstance';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const { socket } = useSocket();

  const getLocalTodayDate = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  
  const getLocalCurrentTime = () => {
    const d = new Date();
    return d.toTimeString().substring(0, 5);
  };

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      leaveDate: getLocalTodayDate(),
      leaveTime: getLocalCurrentTime(),
      returnDate: getLocalTodayDate(),
    }
  });
  const selectedPassType = watch('passType');
  const leaveDateVal = watch('leaveDate');
  const leaveTimeVal = watch('leaveTime');
  const returnDateVal = watch('returnDate');
  const returnTimeVal = watch('returnTime');

  const hasActivePass = passes.some(p => ['Pending', 'Approved'].includes(p.status));

  const fetchPasses = async () => {
    try {
      const { data } = await axiosInstance.get('/pass');
      setPasses(data);
    } catch (error) {
      console.error('Failed to fetch passes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePass = async (passId) => {
    if (!window.confirm('Are you sure you want to delete this pass from your history?')) return;
    try {
      await axiosInstance.delete(`/pass/${passId}`);
      setPasses(prev => prev.filter(p => p._id !== passId));
      toast.success('Pass deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete pass');
    }
  };

  useEffect(() => {
    fetchPasses();
  }, []);

  useEffect(() => {
    if (socket) {
      const handleNotification = (data) => {
        if (['Pass Approved', 'Pass Rejected', 'Gate Scan Successful'].includes(data.title)) {
          fetchPasses();
        }
      };
      socket.on('notification', handleNotification);
      return () => {
        socket.off('notification', handleNotification);
      };
    }
  }, [socket]);

  const onSubmit = async (data) => {
    try {
      // Combine Date and Time inputs into single Date objects
      const departureDate = new Date(`${data.leaveDate}T${data.leaveTime}`);
      const expectedReturnDate = new Date(`${data.returnDate}T${data.returnTime}`);

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
      fetchPasses();
      toast.success('Pass requested successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to apply for pass');
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Rejected': 
      case 'Expired':
      case 'Revoked': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getMinReturnTime = () => {
    if (returnDateVal && leaveDateVal && returnDateVal === leaveDateVal && leaveTimeVal) {
      return leaveTimeVal;
    }
    if (returnDateVal === getLocalTodayDate()) {
      return getLocalCurrentTime();
    }
    return undefined;
  };

  const stats = [
    { title: 'Pending', value: passes.filter(p => p.status === 'Pending').length, icon: <Clock className="text-amber-500" /> },
    { title: 'Approved', value: passes.filter(p => p.status === 'Approved').length, icon: <CheckCircle className="text-emerald-500" /> },
    { title: 'Completed', value: passes.filter(p => p.status === 'Completed').length, icon: <XCircle className="text-blue-500" /> },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex justify-between items-center relative overflow-hidden">
        <div className="z-10">
          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back, {user?.name}!</h2>
          <p className="text-sm text-muted-foreground">Manage your gate passes and view your activity history.</p>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Stats */}
        <div className="col-span-1 md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col justify-center items-center text-center gap-2">
              <div className="p-2 bg-secondary/10 rounded-full">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mt-1">{stat.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Action */}
        <div className="col-span-1 bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col justify-center p-4">
          {hasActivePass ? (
            <div className="flex flex-col items-center justify-center p-6 border border-amber-200/60 bg-amber-500/5 rounded-xl text-amber-600 h-full text-center space-y-1">
              <Clock className="text-amber-500 animate-pulse" size={24} />
              <span className="font-bold text-sm text-foreground">Active Pass Exists</span>
              <span className="text-[10px] text-muted-foreground">Only one active or pending gate pass is allowed at a time. Delete your current pass to request a new one.</span>
            </div>
          ) : (
            <button 
              onClick={() => setShowApplyModal(true)}
              className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/30 rounded-xl text-primary hover:bg-primary/5 hover:border-primary transition-all group h-full"
            >
              <div className="bg-primary text-primary-foreground w-10 h-10 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <FilePlus size={20} />
              </div>
              <span className="font-bold text-sm">Apply for Pass</span>
            </button>
          )}
        </div>
      </div>

      {/* Pass History */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border bg-secondary/10">
          <h3 className="font-semibold text-lg">My Gate Passes</h3>
        </div>
        {loading ? (
          <div className="p-8 text-center text-muted-foreground animate-pulse">Loading passes...</div>
        ) : passes.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">You haven't applied for any passes yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/5 text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Type & Dest.</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">QR Pass</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {passes.map(pass => (
                  <tr key={pass._id} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{pass.purpose}</div>
                      <div className="text-xs text-muted-foreground max-w-[150px] truncate">{pass.destination || pass.reason}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <div><span className="text-muted-foreground">Out:</span> {format(new Date(pass.leaveDate), "dd MMM, HH:mm")}</div>
                      <div><span className="text-muted-foreground">In:</span> {format(new Date(pass.returnDate), "dd MMM, HH:mm")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 border rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(pass.status)}`}>
                        {pass.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end items-center gap-2">
                      {pass.status === 'Approved' ? (
                         <button 
                            onClick={() => setSelectedQR(pass)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md transition-all text-xs shadow-sm"
                         >
                           <QrIcon size={14} /> Show Pass
                         </button>
                      ) : (
                        <span className="text-xs text-muted-foreground italic mr-2">Unavailable</span>
                      )}

                      {['Pending', 'Approved', 'Completed', 'Rejected', 'Cancelled'].includes(pass.status) && (
                        <button
                          onClick={() => handleDeletePass(pass._id)}
                          className="px-2.5 py-1.5 border border-destructive/20 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white font-bold rounded-lg transition-all text-xs shadow-sm"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Pass Modal */}
      <AnimatePresence>
        {showApplyModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
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
                    <input type="date" min={getLocalTodayDate()} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" {...register('leaveDate', { required: true })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</label>
                    <input 
                      type="time" 
                      min={leaveDateVal === getLocalTodayDate() ? getLocalCurrentTime() : undefined}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-secondary/5 text-foreground scheme-dark" 
                      {...register('leaveTime', { 
                        required: 'Leave time is required',
                        validate: value => {
                          if (leaveDateVal === getLocalTodayDate() && value < getLocalCurrentTime()) {
                            return 'Time cannot be in the past';
                          }
                          return true;
                        }
                      })} 
                    />
                    {errors.leaveTime && <p className="text-red-500 text-xs mt-1">{errors.leaveTime.message}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Date</label>
                    <input type="date" min={watch('leaveDate') || getLocalTodayDate()} className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" {...register('returnDate', { required: true })} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</label>
                    <input 
                      type="time" 
                      min={getMinReturnTime()}
                      onClick={(e) => e.target.showPicker && e.target.showPicker()}
                      onFocus={(e) => e.target.showPicker && e.target.showPicker()}
                      className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer hover:bg-secondary/5 text-foreground scheme-dark" 
                      {...register('returnTime', { 
                        required: 'Return time is required',
                        validate: value => {
                          const minTime = getMinReturnTime();
                          if (minTime && value < minTime) {
                            return 'Invalid return time';
                          }
                          return true;
                        }
                      })} 
                    />
                    {errors.returnTime && <p className="text-red-500 text-xs mt-1">{errors.returnTime.message}</p>}
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

      {/* QR Code Modal */}
      <AnimatePresence>
        {selectedQR && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full relative flex flex-col items-center"
            >
              <button onClick={() => setSelectedQR(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-1">
                <X size={20} />
              </button>
              
              <div className="text-center mb-6 w-full border-b pb-4">
                <h3 className="text-xl font-bold text-gray-900">Valid Gate Pass</h3>
                <p className="text-sm text-gray-500 font-medium">{selectedQR.purpose}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl mb-6 shadow-inner border border-gray-100">
                {/* QR Code Payload: passId:signature */}
                 <QRCodeSVG 
                  value={`${window.location.origin}/verify-pass?token=${selectedQR._id}:${selectedQR.qrToken}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="w-full space-y-2 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Name</span>
                  <span className="font-bold">{user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Destination</span>
                  <span className="font-bold text-right truncate max-w-[150px]">{selectedQR.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-500">Valid Until</span>
                  <span className="font-bold text-rose-600">{format(new Date(selectedQR.returnDate), "dd MMM, HH:mm")}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t w-full text-center">
                 <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Show this QR to Main Gate Guard at the Gate</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default StudentDashboard;
