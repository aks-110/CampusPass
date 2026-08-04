import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Search } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { format } from 'date-fns';

const StudentHistory = () => {
  const [passes, setPasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchPassHistory = async () => {
    try {
      const { data } = await axiosInstance.get('/pass');
      setPasses(data);
    } catch (error) {
      console.error('Failed to fetch history', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassHistory();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Rejected': 
      case 'Expired': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredPasses = passes.filter(pass => {
    const matchesSearch = (pass.destination || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (pass.purpose || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || pass.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div>
        <h2 className="text-3xl font-bold text-primary">Gate Pass History</h2>
        <p className="text-muted-foreground">Review your past gate passes and logs.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 border border-border rounded-xl shadow-sm justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search by destination or purpose..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-10 w-full pl-10 pr-4 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-4 rounded-lg border border-input bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
        >
          <option value="All">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
          <option value="Rejected">Rejected</option>
          <option value="Expired">Expired</option>
        </select>
      </div>

      {/* History List */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse">Loading history...</div>
        ) : filteredPasses.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
            <FileText size={48} className="opacity-20 text-muted-foreground" />
            <p>No historical passes found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary/5 text-muted-foreground uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Purpose & Dest.</th>
                  <th className="px-6 py-4">Applied Date</th>
                  <th className="px-6 py-4">Timings</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPasses.map(pass => (
                  <tr key={pass._id} className="hover:bg-secondary/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground">{pass.purpose}</div>
                      <div className="text-xs text-muted-foreground">{pass.destination}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">
                      {format(new Date(pass.createdAt), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <div><span className="text-muted-foreground">Departure:</span> {format(new Date(pass.leaveDate), 'dd MMM, HH:mm')}</div>
                      <div><span className="text-muted-foreground">Expected Return:</span> {format(new Date(pass.returnDate), 'dd MMM, HH:mm')}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 border rounded-md text-[10px] font-bold uppercase tracking-wider ${getStatusColor(pass.status)}`}>
                        {pass.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-xs">
                      {pass.exitTime && (
                        <div>
                          <span className="text-muted-foreground">Exit:</span> {format(new Date(pass.exitTime), 'HH:mm')}
                          {pass.exitGate && <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded ml-1 font-semibold">{pass.exitGate}</span>}
                        </div>
                      )}
                      {pass.entryTime && (
                        <div>
                          <span className="text-muted-foreground">Entry:</span> {format(new Date(pass.entryTime), 'HH:mm')}
                          {pass.entryGate && <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded ml-1 font-semibold">{pass.entryGate}</span>}
                        </div>
                      )}
                      {!pass.exitTime && !pass.entryTime && (
                        <span className="text-muted-foreground italic">No logs</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default StudentHistory;


