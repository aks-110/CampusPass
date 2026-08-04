import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Search, User, MapPin, ShieldCheck, ShieldAlert, ArrowRightLeft } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const MainGateSearch = () => {
  const [query, setQuery] = useState('');
  const [student, setStudent] = useState(null);
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError('');
    setStudent(null);
    setPasses([]);

    try {
      // Fetch matching student profile and passes from indexed query
      const { data } = await axiosInstance.get(`/gate/search-student?q=${encodeURIComponent(query)}`);
      setStudent(data.student);
      setPasses(data.passes);
    } catch (err) {
      setError(err.response?.data?.message || 'No student found matching query.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Search Student</h2>
        <p className="text-muted-foreground">Search student profiles, gate status, and pass history manually.</p>
      </div>

      {/* Search Input */}
      <form onSubmit={handleSearch} className="flex gap-4 bg-card p-4 border border-border rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by student name, email, or roll number..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full pl-10 pr-4 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-lg text-sm hover:bg-primary/90 transition-colors shadow-sm"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl">
          {error}
        </div>
      )}

      {student && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Identity Card */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center text-primary font-extrabold text-2xl border-2 border-primary/20">
              {student.photo ? (
                <img src={student.photo.startsWith('http') ? student.photo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${student.photo}`} alt="Profile" className="w-full h-full rounded-full object-cover" />
              ) : (
                student.name.charAt(0)
              )}
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">{student.name}</h3>
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{student.email}</p>
            </div>
            <div className="w-full border-t border-border pt-4 grid grid-cols-2 text-xs">
              <div>
                <p className="font-bold text-primary">{student.phone || 'N/A'}</p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Phone</p>
              </div>
              <div>
                <p className="font-bold text-primary flex items-center justify-center gap-1">
                  <ArrowRightLeft size={12} className="text-blue-500 animate-pulse" />
                  {student.currentLocation || 'Inside'}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase font-semibold">Location</p>
              </div>
            </div>
          </div>

          {/* Pass History */}
          <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-foreground border-b border-border pb-2 mb-4">Gate Pass History</h3>
            
            {passes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground italic py-12">
                No pass request records found for this student.
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {passes.map(pass => (
                  <div key={pass._id} className="p-4 border border-border bg-secondary/5 rounded-xl flex justify-between items-center gap-4 hover:bg-secondary/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{pass.purpose}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Dest: {pass.destination || 'N/A'}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Scheduled: {format(new Date(pass.leaveDate), 'dd MMM, HH:mm')} - {format(new Date(pass.returnDate), 'dd MMM, HH:mm')}
                      </p>
                      {(pass.exitTime || pass.entryTime) && (
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">
                          {pass.exitTime && `Exit: ${format(new Date(pass.exitTime), 'dd MMM, HH:mm')} (${pass.exitGate || 'N/A'})`}
                          {pass.entryTime && ` | Return: ${format(new Date(pass.entryTime), 'dd MMM, HH:mm')} (${pass.entryGate || 'N/A'})`}
                        </p>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider ${pass.status === 'Approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                      {pass.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default MainGateSearch;
