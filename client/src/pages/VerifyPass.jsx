import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Clock, ArrowLeft, Calendar, CheckCircle2, MapPin, Loader2, Fingerprint } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'date-fns';

const VerifyPass = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPassDetails = async () => {
      if (!token) {
        setError('No verification token provided.');
        setLoading(false);
        return;
      }
      try {
        const { data } = await axiosInstance.get(`/pass/public-verify/${token}`);
        setPassData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Invalid or expired verification link.');
      } finally {
        setLoading(false);
      }
    };

    fetchPassDetails();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Expired':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'Overdue':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return <ShieldCheck className="h-5 w-5" />;
      case 'Expired':
      case 'Overdue':
        return <ShieldAlert className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-5 px-4">
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg p-12 flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="h-10 w-10 text-[#1e4479] animate-spin" />
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Verifying Pass Integrity...
            </p>
          </motion.div>
        ) : error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg overflow-hidden"
          >
             <div className="bg-[#1e4479] text-white px-6 py-4 flex items-center gap-4 border-b-[3px] border-[#e5a93b]">
                <div className="p-2 border border-white/30 rounded-full bg-white/10 shrink-0">
                  <ShieldAlert className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-wide">Verification Failed</h2>
                  <p className="text-[11px] text-white/80">Security Check</p>
                </div>
             </div>
             
             <div className="p-6">
                <div className="mb-6 p-4 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg flex flex-col items-center gap-2 text-center">
                  <span>{error}</span>
                </div>
                
                <Link
                  to="/login"
                  className="w-full py-2.5 bg-white border border-[#d2d6dc] hover:bg-gray-50 text-gray-800 font-semibold rounded-md text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ArrowLeft className="h-4 w-4" /> Return to CampusPass
                </Link>
             </div>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg overflow-hidden"
          >
            {/* Card Header (NITH Navy Theme) */}
            <div className="bg-[#1e4479] text-white px-6 py-4 flex items-center justify-between border-b-[3px] border-[#e5a93b]">
              <div className="flex items-center gap-4">
                <div className="p-2 border border-white/30 rounded-full bg-white/10 shrink-0">
                  <Fingerprint className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-base font-bold tracking-wide">Digital Gate Pass</h2>
                  <p className="text-[11px] text-white/80">Authorized Document</p>
                </div>
              </div>
            </div>

            {/* Dynamic Status Banner */}
            <div className={`px-6 py-3 border-b flex items-center justify-center gap-2 ${getStatusColor(passData.passDetails.status)}`}>
              {getStatusIcon(passData.passDetails.status)}
              <span className="font-bold tracking-widest uppercase text-sm">
                {passData.passDetails.status}
              </span>
            </div>

            <div className="p-6">
              {/* Student Profile Identity */}
              <div className="flex flex-col items-center text-center mb-6">
                <div className="relative mb-3">
                  {passData.student.photo ? (
                    <img
                      src={passData.student.photo.startsWith('http') ? passData.student.photo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${passData.student.photo.replace(/\\/g, '/')}`}
                      alt={passData.student.name}
                      className="w-20 h-20 rounded-full object-cover border border-gray-200 shadow-sm"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-[#fcfdfe] border border-[#d2d6dc] text-[#1e4479] rounded-full flex items-center justify-center font-extrabold text-2xl shadow-sm">
                      {passData.student.name.charAt(0)}
                    </div>
                  )}
                  {/* Status Dot */}
                  <div className={`absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white ${passData.passDetails.status === 'Approved' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-1">{passData.student.name}</h2>
                <div className="inline-flex items-center justify-center px-2 py-0.5 bg-gray-100 border border-gray-200 rounded text-[11px] font-bold text-gray-600 tracking-wide">
                  {passData.student.rollNumber}
                </div>
                
                <p className="text-[11px] text-[#1e4479] font-bold uppercase tracking-widest mt-3 flex items-center gap-1.5">
                  <MapPin className="h-3 w-3" />
                  {passData.student.hostel} • Room {passData.student.room}
                </p>
              </div>

              <hr className="border-gray-100 mb-6" />

              {/* Pass Specifics Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Destination</p>
                  <p className="text-sm font-semibold text-gray-800 bg-[#fcfdfe] border border-gray-200 p-2.5 rounded">
                    {passData.passDetails.destination || 'Not Specified'}
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Out Time
                  </p>
                  <p className="text-[13px] font-bold text-gray-900">
                    {format(new Date(passData.passDetails.leaveDate), 'dd MMM, HH:mm')}
                  </p>
                </div>
                
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Expected In
                  </p>
                  <p className="text-[13px] font-bold text-gray-900">
                    {format(new Date(passData.passDetails.returnDate), 'dd MMM, HH:mm')}
                  </p>
                </div>
              </div>

              {/* Gate Logs */}
              {(passData.passDetails.exitTime || passData.passDetails.entryTime) && (
                <div className="mt-6 pt-5 border-t border-gray-100 space-y-2.5">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 text-center">Security Activity</p>
                  
                  {passData.passDetails.exitTime && (
                    <div className="flex justify-between items-center p-2.5 rounded bg-[#fcfdfe] border border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Exit Logged</span>
                        <span className="text-[10px] text-gray-400">{passData.passDetails.exitGate || 'Main Gate'}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-600">
                        {format(new Date(passData.passDetails.exitTime), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                  )}
                  
                  {passData.passDetails.entryTime && (
                    <div className="flex justify-between items-center p-2.5 rounded bg-[#fcfdfe] border border-gray-200">
                       <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-gray-500 uppercase">Entry Logged</span>
                        <span className="text-[10px] text-gray-400">{passData.passDetails.entryGate || 'Main Gate'}</span>
                      </div>
                      <span className="font-mono text-[11px] font-bold text-emerald-600">
                        {format(new Date(passData.passDetails.entryTime), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Security Footer Stamp */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 text-center flex flex-col items-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 border border-green-200 rounded-full text-[10px] font-bold tracking-widest uppercase mb-2">
                <CheckCircle2 className="h-3 w-3" /> Authenticity Verified
              </div>
              <p className="text-[9px] text-gray-400 font-mono tracking-widest uppercase">
                ID: {passData.passDetails.id.slice(-8)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerifyPass;
