import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Building, Plus, Trash2, UserPlus, CheckCircle } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { useForm } from 'react-hook-form';

const AdminHostels = () => {
  const [hostels, setHostels] = useState([]);
  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(null); // hostel object
  const [selectedWarden, setSelectedWarden] = useState('');
  
  const { register, handleSubmit, reset } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const hostelRes = await axiosInstance.get('/hostels');
      setHostels(hostelRes.data);
      
      const wardenRes = await axiosInstance.get('/admin/users?role=Warden');
      setWardens(wardenRes.data);
    } catch (error) {
      console.error('Failed to fetch hostel management data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreateHostel = async (data) => {
    try {
      const res = await axiosInstance.post('/hostels', {
        name: data.name,
        capacity: Number(data.capacity)
      });
      setHostels([...hostels, res.data.hostel]);
      reset();
    } catch (error) {
      alert('Failed to create hostel');
    }
  };

  const onDeleteHostel = async (hostelId) => {
    if (!window.confirm('Are you sure you want to permanently delete this hostel?')) return;
    try {
      await axiosInstance.delete(`/hostels/${hostelId}`);
      setHostels(hostels.filter(h => h._id !== hostelId));
    } catch (error) {
      alert('Failed to delete hostel');
    }
  };

  const onAssignWardenSubmit = async (e) => {
    e.preventDefault();
    if (!selectedWarden) return;
    try {
      await axiosInstance.put(`/hostels/${assignModal._id}/assign`, { wardenId: selectedWarden });
      setAssignModal(null);
      setSelectedWarden('');
      fetchData(); // Refresh to populate new warden info
    } catch (error) {
      alert('Failed to assign warden');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-primary">Hostel Management</h2>
        <p className="text-muted-foreground">Add new hostels, track residency capacities, and assign wardens.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Hostel Form */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-fit">
          <div className="flex gap-2 items-center mb-4 border-b border-border pb-3">
            <Plus className="text-primary" size={20} />
            <h3 className="font-bold text-foreground">Create Hostel</h3>
          </div>
          <form onSubmit={handleSubmit(onCreateHostel)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hostel Name</label>
              <input
                type="text"
                placeholder="e.g. Boys Hostel 4"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...register('name', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Capacity (Residents)</label>
              <input
                type="number"
                placeholder="e.g. 200"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...register('capacity', { required: true })}
              />
            </div>
            <button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm"
            >
              Add Hostel
            </button>
          </form>
        </div>

        {/* Hostel Directory */}
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl bg-card">Loading hostel list...</div>
          ) : hostels.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground bg-card border border-border rounded-xl">No hostels registered yet.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hostels.map(h => (
                <div key={h._id} className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-4 relative overflow-hidden">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-foreground">{h.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Capacity: {h.capacity || 'N/A'} Students</p>
                    </div>
                    <div className="p-2.5 bg-primary/5 text-primary rounded-xl">
                      <Building size={20} />
                    </div>
                  </div>

                  <div className="border-t border-border pt-3">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Warden Assigned</p>
                    <p className="font-semibold text-sm text-foreground mt-0.5">
                      {h.wardenId?.name || 'No warden assigned'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setAssignModal(h)}
                      className="flex-1 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UserPlus size={14} /> Assign Warden
                    </button>
                    <button
                      onClick={() => onDeleteHostel(h._id)}
                      className="py-2 px-3 border border-destructive/20 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assign Warden Modal */}
      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-card p-6 rounded-2xl shadow-2xl max-w-sm w-full relative border border-border">
            <h3 className="text-xl font-bold text-primary mb-4 border-b border-border pb-2">Assign Warden</h3>
            <form onSubmit={onAssignWardenSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Warden</label>
                <select
                  value={selectedWarden}
                  onChange={(e) => setSelectedWarden(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                >
                  <option value="">Choose Warden...</option>
                  {wardens.map(w => <option key={w._id} value={w._id}>{w.name} ({w.email})</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModal(null)}
                  className="flex-1 py-2.5 border border-border text-muted-foreground hover:text-foreground font-bold rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-[2] py-2.5 bg-primary text-primary-foreground font-bold rounded-lg text-xs hover:bg-primary/90 transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <CheckCircle size={14} /> Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AdminHostels;
