import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

const ClockTimePicker = ({ value, onChange, label = 'Select Time' }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // State for the picker
  const [mode, setMode] = useState('hours'); // 'hours' or 'minutes'
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState('AM'); // 'AM' or 'PM'

  // Initialize state from value string (e.g., "14:30" or "05:05")
  useEffect(() => {
    if (value) {
      const [hStr, mStr] = value.split(':');
      let h = parseInt(hStr, 10);
      const m = parseInt(mStr, 10);
      
      if (!isNaN(h) && !isNaN(m)) {
        if (h >= 12) {
          setPeriod('PM');
          if (h > 12) h -= 12;
        } else {
          setPeriod('AM');
          if (h === 0) h = 12;
        }
        setHour(h);
        setMinute(m);
      }
    }
  }, [value, isOpen]);

  const handleHourSelect = (h) => {
    setHour(h);
    // Add a tiny delay before switching to minutes for better UX
    setTimeout(() => setMode('minutes'), 300);
  };

  const handleMinuteSelect = (m) => {
    setMinute(m);
  };

  const handleOk = () => {
    // Format to 24h "HH:MM"
    let h24 = hour;
    if (period === 'PM' && hour < 12) h24 += 12;
    if (period === 'AM' && hour === 12) h24 = 0;
    
    const formatted = `${h24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    onChange(formatted);
    setIsOpen(false);
  };

  const formatDisplayTime = (val) => {
    if (!val) return '--:--';
    const [h, m] = val.split(':');
    let hInt = parseInt(h, 10);
    const p = hInt >= 12 ? 'PM' : 'AM';
    if (hInt === 0) hInt = 12;
    if (hInt > 12) hInt -= 12;
    return `${hInt.toString().padStart(2, '0')}:${m} ${p}`;
  };

  const radius = 90;

  const generateClockNumbers = () => {
    const items = [];
    const total = mode === 'hours' ? 12 : 12;
    
    for (let i = 1; i <= total; i++) {
      let val = mode === 'hours' ? i : (i === 12 ? 0 : i * 5);
      
      // Calculate angle (starts at 12 o'clock which is -90 degrees)
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      
      const isSelected = mode === 'hours' ? hour === val : minute === val;

      items.push(
        <motion.button
          key={`${mode}-${val}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          onClick={() => mode === 'hours' ? handleHourSelect(val) : handleMinuteSelect(val)}
          className={`absolute flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors z-10
            ${isSelected ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-secondary'}
          `}
          style={{
            transform: `translate(calc(${x}px - 50%), calc(${y}px - 50%))`,
            left: '50%',
            top: '50%'
          }}
        >
          {val === 0 && mode === 'minutes' ? '00' : val.toString().padStart(mode === 'minutes' ? 2 : 1, '0')}
        </motion.button>
      );
    }
    return items;
  };

  // Get coordinates for the clock hand
  const getHandStyle = () => {
    let val = mode === 'hours' ? hour : minute / 5;
    if (val === 0) val = 12; // For 0 minutes (top)
    
    const angle = val * 30; // degrees
    return {
      transform: `rotate(${angle}deg)`,
      height: `${radius}px`
    };
  };

  return (
    <>
      <div 
        onClick={() => {
          setMode('hours');
          setIsOpen(true);
        }}
        className="w-full h-10 rounded-md border border-input bg-transparent px-3 flex items-center justify-between cursor-pointer hover:border-primary transition-all"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground'}>
          {value ? formatDisplayTime(value) : label}
        </span>
        <Clock size={16} className="text-muted-foreground" />
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-[320px] rounded-3xl overflow-hidden shadow-2xl border border-border flex flex-col"
            >
              {/* Header Section */}
              <div className="p-6 bg-secondary/30 flex justify-between items-center">
                <div className="flex items-baseline gap-1 text-5xl font-light tracking-tighter text-foreground">
                  <button 
                    onClick={() => setMode('hours')}
                    className={`hover:text-primary transition-colors ${mode === 'hours' ? 'text-primary font-medium' : 'opacity-50'}`}
                  >
                    {hour.toString().padStart(2, '0')}
                  </button>
                  <span className="opacity-50 text-4xl">:</span>
                  <button 
                    onClick={() => setMode('minutes')}
                    className={`hover:text-primary transition-colors ${mode === 'minutes' ? 'text-primary font-medium' : 'opacity-50'}`}
                  >
                    {minute.toString().padStart(2, '0')}
                  </button>
                </div>
                
                <div className="flex flex-col border border-border rounded-xl overflow-hidden text-sm font-semibold">
                  <button 
                    onClick={() => setPeriod('AM')}
                    className={`px-3 py-1.5 transition-colors ${period === 'AM' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-secondary'}`}
                  >
                    AM
                  </button>
                  <div className="h-px bg-border w-full" />
                  <button 
                    onClick={() => setPeriod('PM')}
                    className={`px-3 py-1.5 transition-colors ${period === 'PM' ? 'bg-primary text-primary-foreground' : 'bg-background text-muted-foreground hover:bg-secondary'}`}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Clock Face Section */}
              <div className="flex-1 flex items-center justify-center p-8 bg-card relative">
                <div className="w-[240px] h-[240px] rounded-full bg-secondary/50 relative flex items-center justify-center">
                  
                  {/* Center Dot */}
                  <div className="w-2 h-2 rounded-full bg-primary absolute z-20" />
                  
                  {/* Clock Hand */}
                  <div 
                    className="absolute bottom-1/2 left-1/2 w-0.5 bg-primary origin-bottom rounded-full z-0 transition-transform duration-300 ease-out"
                    style={{
                      ...getHandStyle(),
                      transformOrigin: '50% 100%',
                      marginLeft: '-1px'
                    }}
                  >
                    {/* Circle at the end of the hand */}
                    <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-primary/20 pointer-events-none" />
                  </div>

                  {/* Numbers */}
                  <AnimatePresence mode="wait">
                    {generateClockNumbers()}
                  </AnimatePresence>
                  
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 flex justify-end gap-2 bg-card">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleOk}
                  className="px-4 py-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ClockTimePicker;
