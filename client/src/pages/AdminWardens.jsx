import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Plus, Trash2, KeyRound, Ban, CheckCircle } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { useForm } from 'react-hook-form';

const AdminWardens = () => {
  const [wardens, setWardens] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const wardenRes = await axiosInstance.get('/admin/users?role=Warden');
      setWardens(wardenRes.data);
      
      const hostelRes = await axiosInstance.get('/hostels');
      setHostels(hostelRes.data);
    } catch (error) {
      console.error('Failed to fetch warden data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreateWarden = async (data) => {
    try {
      // 1. Register the Warden
      const registerRes = await axiosInstance.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 'Warden',
        assignedHostel: data.hostelName
      });

      // 2. Since register defaults to Pending, Admin automatically approves them
      // We need to find the user ID. The auth register endpoint returns message, but let's see.
      // If register doesn't return the user object directly, we can fetch all users again.
      alert('Warden registered successfully! They will appear in the pending approvals or list.');
      reset();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create warden account.');
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await axiosInstance.put(`/admin/users/${userId}/status`, { status: nextStatus });
      setWardens(wardens.map(w => w._id === userId ? { ...w, status: nextStatus } : w));
    } catch (error) {
      alert('Failed to update warden status');
    }
  };

  const handlePasswordReset = async (userId) => {
    if (!window.confirm('Reset this warden\'s password and email them a new one?')) return;
    try {
      await axiosInstance.put(`/admin/users/${userId}/reset-password`);
      alert('Password reset successfully and sent to their email.');
    } catch (error) {
      alert('Failed to reset password');
    }
  };

  const handleDeleteWarden = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this warden? This cannot be undone.')) return;
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      setWardens(wardens.filter(w => w._id !== userId));
    } catch (error) {
      alert('Failed to delete warden');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-primary">Warden Management</h2>
        <p className="text-muted-foreground">Provision warden credentials, reset staff passwords, and activate/deactivate accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Warden Form */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-fit">
          <div className="flex gap-2 items-center mb-4 border-b border-border pb-3">
            <Plus className="text-primary" size={20} />
            <h3 className="font-bold text-foreground">Add Warden</h3>
          </div>
          <form onSubmit={handleSubmit(onCreateWarden)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Dr. Satish Kumar"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...register('name', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                placeholder="e.g. satish@nith.ac.in"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...register('email', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
              <input
                type="password"
                placeholder="Password"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...register('password', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone Number</label>
              <input
                type="text"
                placeholder="e.g. 9876543210"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...register('phone')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Hostel Assignment</label>
              <select
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer"
                {...register('hostelName', { required: true })}
              >
                <option value="">Select Hostel...</option>
                {hostels.map(h => <option key={h._id} value={h.name}>{h.name}</option>)}
              </select>
            </div>
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Warden'}
            </button>
          </form>
        </div>

        {/* Warden Directory */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Warden Directory</h3>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {wardens.length} Wardens
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">Loading wardens...</div>
          ) : wardens.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No wardens registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {wardens.map(w => (
                    <tr key={w._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{w.name}</td>
                      <td className="px-6 py-4">{w.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider ${w.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button
                          onClick={() => handleStatusChange(w._id, w.status)}
                          title={w.status === 'Active' ? 'Suspend' : 'Activate'}
                          className={`p-2 rounded-lg transition-colors ${w.status === 'Active' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                        >
                          {w.status === 'Active' ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button
                          onClick={() => handlePasswordReset(w._id)}
                          title="Reset Password"
                          className="p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteWarden(w._id)}
                          title="Delete Account"
                          className="p-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminWardens;
