import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import axiosInstance from '../utils/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, LogOut, LogIn, ArrowRight, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { useSelector } from 'react-redux';

const MainGateDashboard = () => {
  const { user } = useSelector(state => state.auth);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const qrCodeInstanceRef = useRef(null);
  const [actionType, setActionType] = useState('Exit'); // Exit or Return

  // Start scanning helper
  const startScanner = async () => {
    if (!qrCodeInstanceRef.current) return;
    try {
      // If it is already scanning, stop it first to prevent double-start exceptions
      if (qrCodeInstanceRef.current.isScanning) {
        await qrCodeInstanceRef.current.stop();
      }
      await qrCodeInstanceRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          handleScan(decodedText);
        },
        () => {} // Keep scanner errors silent
      );
    } catch (err) {
      console.error("Camera failed to start", err);
    }
  };

  // Stop scanning helper
  const stopScanner = async () => {
    if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
      try {
        await qrCodeInstanceRef.current.stop();
      } catch (err) {
        console.error("Camera failed to stop", err);
      }
    }
  };

  useEffect(() => {
    // Initialize custom scanner once on mount
    const html5QrCode = new Html5Qrcode("qr-reader");
    qrCodeInstanceRef.current = html5QrCode;

    // Delay start slightly to guarantee element is fully in DOM
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(error => console.error("Failed to stop scanner", error));
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionType]); // Re-initialize ONLY when actionType (Exit/Return) changes to keep frame clean

  const handleScan = async (decodedText, isManual = false) => {
    if (isProcessing && !isManual) return;
    setIsProcessing(true);
    setScanResult(null);
    setScanError(null);
 
    // Freeze camera feed immediately
    await stopScanner();
 
    try {
      const { data } = await axiosInstance.post('/gate/verify', { 
        qrPayload: decodedText,
        action: actionType 
      });
      setScanResult(data);
    } catch (error) {
      setScanError(error.response?.data?.message || 'Invalid QR Code');
    }
  };

  const resumeScan = async () => {
    setScanResult(null);
    setScanError(null);
    setIsProcessing(false);
    // Restart scanning feed
    await startScanner();
  };

  const confirmAction = async () => {
    try {
      await axiosInstance.post('/gate/confirm', {
        passId: scanResult.passDetails.id,
        action: actionType,
        gateName: user.assignedGate || 'Main Gate Checkpoint',
        deviceId: 'WEB_SCANNER_01'
      });
      
      alert(`Successfully logged ${actionType} for ${scanResult.student.name}`);
      resumeScan();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to confirm action');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setIsProcessing(true);
    setScanError(null);
    setScanResult(null);

    // Stop active camera
    if (qrCodeInstanceRef.current && qrCodeInstanceRef.current.isScanning) {
      try {
        await qrCodeInstanceRef.current.stop();
      } catch (err) {
        console.error(err);
      }
    }

    const html5QrCode = new Html5Qrcode("qr-reader");
    try {
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScan(decodedText);
    } catch (err) {
      setScanError('Failed to parse QR code from image file. Make sure the QR is clear and well-lit.');
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-primary">Main Gate Checkpoint</h2>
          <p className="text-muted-foreground">{user?.assignedGate} • Live Scanner</p>
        </div>
        
        {/* Toggle Mode */}
        <div className="bg-secondary/20 p-1 rounded-lg flex shadow-sm">
          <button
            onClick={() => setActionType('Exit')}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${
              actionType === 'Exit' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <LogOut size={16} /> Scan Exits
          </button>
          <button
            onClick={() => setActionType('Return')}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${
              actionType === 'Return' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            <LogIn size={16} /> Scan Returns
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Scanner Column */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden p-4 flex flex-col h-full min-h-[400px]">
          <h3 className="font-semibold mb-4 border-b border-border pb-2 text-center">
            {actionType === 'Exit' ? 'Scan Outward QR' : 'Scan Inward QR'}
          </h3>
          <div id="qr-reader" className="w-full flex-1 rounded-lg overflow-hidden border-2 border-dashed border-muted/50" />
          
          <div className="mt-4 pt-4 border-t border-border flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Manual Verification (Or paste QR string):</p>
              <div className="flex gap-2">
                <input 
                  id="manual-qr-input"
                  type="text" 
                  placeholder="Enter Roll Number or paste QR token..."
                  className="flex-1 h-9 px-3 rounded-md border border-input bg-transparent text-xs focus:outline-none focus:ring-1 focus:ring-primary outline-none"
                />
                <button 
                  id="manual-qr-btn"
                  type="button"
                  onClick={() => {
                    const val = document.getElementById('manual-qr-input').value;
                    if (val) handleScan(val, true);
                  }}
                  className="px-3 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-md hover:bg-primary/90 transition-colors"
                >
                  Verify
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1 border-t border-border/50 pt-2">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Or upload a QR code image to test:</p>
              <input 
                type="file" 
                accept="image/*"
                onChange={handleFileChange}
                className="text-xs text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer w-full"
              />
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
          
          <AnimatePresence mode="wait">
            {!scanResult && !scanError && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-muted-foreground flex flex-col items-center gap-4">
                <div className="p-4 bg-secondary/20 rounded-full animate-pulse">
                  <QrCode size={48} className="opacity-50" />
                </div>
                <p>Waiting for QR Scan...</p>
              </motion.div>
            )}

            {scanError && (
              <motion.div key="error" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="w-full h-full flex flex-col items-center justify-center text-center p-6 bg-destructive/10 border-2 border-destructive rounded-xl">
                <ShieldAlert size={64} className="text-destructive mb-4" />
                <h3 className="text-2xl font-bold text-destructive mb-2">ACCESS DENIED</h3>
                <p className="text-destructive/80 font-medium">{scanError}</p>
                <button onClick={resumeScan} className="mt-8 px-6 py-2 bg-destructive text-white rounded-md font-bold hover:bg-destructive/90 transition-colors">
                  Scan Next Person
                </button>
              </motion.div>
            )}

            {scanResult && (
              <motion.div key="success" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full h-full flex flex-col border border-emerald-500/30 rounded-xl overflow-hidden bg-card shadow-lg">
                <div className="bg-emerald-600 text-white p-4 flex items-center justify-center gap-2 shadow-sm">
                  <ShieldCheck size={22} className="animate-pulse" />
                  <h3 className="text-xl font-bold uppercase tracking-wider">Valid Pass</h3>
                </div>
                
                {scanResult.warning && (
                  <div className="bg-amber-500 text-white px-4 py-2 text-xs font-semibold flex items-center gap-2 justify-center border-b border-amber-600/50">
                    <ShieldAlert size={14} /> {scanResult.warning}
                  </div>
                )}
                
                <div className="p-6 flex-1 flex flex-col gap-6">
                  <div className="flex gap-4 items-center border-b border-border pb-4">
                    {scanResult.student.photo ? (
                      <img 
                        src={scanResult.student.photo.startsWith('http') ? scanResult.student.photo : `http://localhost:5000/${scanResult.student.photo.replace(/\\/g, '/')}`} 
                        alt="Student" 
                        className="w-16 h-16 rounded-full object-cover border border-border shadow-sm shrink-0" 
                      />
                    ) : (
                      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex flex-col items-center justify-center text-emerald-600 font-bold border border-emerald-500/20 shadow-sm shrink-0">
                        <span className="text-xs font-normal">Room</span>
                        <span className="text-lg">{scanResult.student.room}</span>
                      </div>
                    )}
                    <div>
                      <h4 className="text-2xl font-bold text-foreground">{scanResult.student.name}</h4>
                      <p className="text-muted-foreground font-medium text-xs mt-0.5">{scanResult.student.rollNumber} • {scanResult.student.hostel}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Pass Type</p>
                      <p className="font-semibold text-foreground mt-0.5">{scanResult.passDetails.type}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Destination</p>
                      <p className="font-semibold text-foreground mt-0.5 truncate" title={scanResult.passDetails.destination || scanResult.passDetails.reason}>
                        {scanResult.passDetails.destination || scanResult.passDetails.reason}
                      </p>
                    </div>
                    <div>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Leaving</p>
                      <p className="font-semibold text-foreground mt-0.5">{format(new Date(scanResult.passDetails.departureDate), "dd MMM, HH:mm")}</p>
                    </div>
                    <div>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-wider">Return By</p>
                      <p className="font-bold text-rose-600 mt-0.5">{format(new Date(scanResult.passDetails.expectedReturn), "dd MMM, HH:mm")}</p>
                    </div>
                  </div>

                  {scanResult.student.idCard && (
                    <div className="border-t border-border pt-4">
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">Verification ID Card Proof</p>
                      <a 
                        href={scanResult.student.idCard.startsWith('http') ? scanResult.student.idCard : `http://localhost:5000/${scanResult.student.idCard.replace(/\\/g, '/')}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block rounded-xl overflow-hidden border border-border bg-background max-h-[90px] cursor-zoom-in group relative"
                      >
                        <img 
                          src={scanResult.student.idCard.startsWith('http') ? scanResult.student.idCard : `http://localhost:5000/${scanResult.student.idCard.replace(/\\/g, '/')}`} 
                          alt="ID Card Proof" 
                          className="w-full object-cover max-h-[90px] group-hover:scale-102 transition-transform duration-200" 
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[9px] tracking-wider uppercase">
                          Inspect Proof Image
                        </div>
                      </a>
                    </div>
                  )}

                  <div className="mt-auto pt-4 flex gap-3">
                    <button onClick={resumeScan} className="flex-1 py-2.5 border border-border text-muted-foreground hover:text-foreground font-bold rounded-lg transition-colors text-xs">
                      Cancel
                    </button>
                    <button onClick={confirmAction} className="flex-[2] py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-md flex items-center justify-center gap-1.5 text-xs">
                      Allow {actionType} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
};

export default MainGateDashboard;
