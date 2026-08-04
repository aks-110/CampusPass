import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Clock, ArrowLeft, Landmark, Calendar, CheckCircle2 } from 'lucide-react';
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
        return 'bg-emerald-500 text-white border-emerald-600';
      case 'Completed':
        return 'bg-blue-600 text-white border-blue-700';
      case 'Expired':
        return 'bg-rose-600 text-white border-rose-700';
      case 'Overdue':
        return 'bg-amber-600 text-white border-amber-700';
      default:
        return 'bg-gray-600 text-white border-gray-700';
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 selection:bg-primary selection:text-white">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mb-6">
        <Landmark className="text-secondary w-8 h-8" />
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          CampusPass <span className="text-secondary">Portal</span>
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Verification Status Header Banner */}
        {loading ? (
          <div className="h-2 bg-primary/20 w-full animate-pulse" />
        ) : error ? (
          <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-500 p-4 flex items-center justify-center gap-2 font-bold text-sm">
            <ShieldAlert size={18} /> Verification Failed
          </div>
        ) : (
          <div className={`p-4 flex items-center justify-center gap-2 font-bold text-sm border-b uppercase tracking-wider ${getStatusColor(passData.passDetails.status)}`}>
            <ShieldCheck size={18} /> {passData.passDetails.status} Pass Verified
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="space-y-6 py-6 text-center animate-pulse">
              <div className="w-20 h-20 bg-slate-800 rounded-full mx-auto" />
              <div className="h-4 bg-slate-800 rounded w-1/2 mx-auto" />
              <div className="h-3 bg-slate-800 rounded w-3/4 mx-auto" />
              <div className="space-y-3 pt-4">
                <div className="h-3 bg-slate-800 rounded w-5/6 mx-auto" />
                <div className="h-3 bg-slate-800 rounded w-2/3 mx-auto" />
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20 shadow-inner">
                <ShieldAlert size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-100">Invalid QR Code</h3>
                <p className="text-xs text-slate-400 px-4">{error}</p>
              </div>
              <div className="pt-4">
                <Link to="/login" className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg transition-colors">
                  <ArrowLeft size={14} /> Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Student Identity Card Profile */}
              <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                {passData.student.photo ? (
                  <img
                    src={passData.student.photo.startsWith('http') ? passData.student.photo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${passData.student.photo.replace(/\\/g, '/')}`}
                    alt={passData.student.name}
                    className="w-16 h-16 rounded-full object-cover border border-slate-800 shadow-lg shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-800 text-slate-300 rounded-full flex items-center justify-center font-extrabold text-xl border border-slate-700 shrink-0">
                    {passData.student.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className="text-lg font-extrabold text-white truncate">{passData.student.name}</h4>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">{passData.student.rollNumber}</p>
                  <p className="text-[10px] text-secondary font-bold uppercase mt-0.5">
                    {passData.student.hostel} • Room {passData.student.room}
                  </p>
                </div>
              </div>

              {/* Pass details */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Pass Type</h4>
                  <p className="text-sm font-semibold text-slate-200 mt-1">{passData.passDetails.purpose || 'Gate Pass'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Destination</h4>
                    <p className="text-sm font-semibold text-slate-200 mt-1 truncate" title={passData.passDetails.destination}>
                      {passData.passDetails.destination || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Status</h4>
                    <span className="inline-block text-xs font-extrabold uppercase mt-1 px-2.5 py-0.5 rounded-full border border-current bg-slate-900">
                      {passData.passDetails.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800/40">
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Calendar size={10} /> Out Date & Time
                    </h4>
                    <p className="text-xs font-semibold text-slate-300 mt-1">
                      {format(new Date(passData.passDetails.leaveDate), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Clock size={10} /> Exp. Return Time
                    </h4>
                    <p className="text-xs font-semibold text-slate-300 mt-1">
                      {format(new Date(passData.passDetails.returnDate), 'dd MMM yyyy, HH:mm')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Gate Scan Activity Logs (exited/entered) */}
              {(passData.passDetails.exitTime || passData.passDetails.entryTime) && (
                <div className="pt-4 border-t border-slate-800 space-y-3">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Gate Logging History</h4>
                  <div className="space-y-2.5 text-xs">
                    {passData.passDetails.exitTime && (
                      <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-800/30">
                        <span className="text-slate-400">Exit Recorded {passData.passDetails.exitGate && `(${passData.passDetails.exitGate})`}</span>
                        <span className="font-mono text-emerald-400">
                          {format(new Date(passData.passDetails.exitTime), 'dd MMM, HH:mm')}
                        </span>
                      </div>
                    )}
                    {passData.passDetails.entryTime && (
                      <div className="flex justify-between items-center p-2 rounded bg-slate-950/40 border border-slate-800/30">
                        <span className="text-slate-400">Entry Recorded {passData.passDetails.entryGate && `(${passData.passDetails.entryGate})`}</span>
                        <span className="font-mono text-emerald-400">
                          {format(new Date(passData.passDetails.entryTime), 'dd MMM, HH:mm')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verification Footer Stamp */}
              <div className="pt-4 border-t border-slate-800 text-center">
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  <CheckCircle2 size={12} /> Crypto-Signed & Verified
                </div>
                <p className="text-[9px] text-slate-500 mt-2 font-mono break-all leading-relaxed">
                  PASS_ID: {passData.passDetails.id}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default VerifyPass;
