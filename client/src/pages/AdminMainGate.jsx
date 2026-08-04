import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Plus, Trash2, KeyRound, Ban, CheckCircle } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';
import { useForm } from 'react-hook-form';

const AdminMainGate = () => {
  const [guards, setGuards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get('/admin/users?role=Main+Gate');
      setGuards(res.data);
    } catch (error) {
      console.error('Failed to fetch main gate data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onCreateGuard = async (data) => {
    try {
      await axiosInstance.post('/auth/register', {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        role: 'Main Gate',
        assignedGate: data.assignedGate
      });

      alert('Main Gate Security registered successfully!');
      reset();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create security account.');
    }
  };

  const handleStatusChange = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
    try {
      await axiosInstance.put(`/admin/users/${userId}/status`, { status: nextStatus });
      setGuards(guards.map(g => g._id === userId ? { ...g, status: nextStatus } : g));
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handlePasswordReset = async (userId) => {
    if (!window.confirm('Reset this security account password and email them a new one?')) return;
    try {
      await axiosInstance.put(`/admin/users/${userId}/reset-password`);
      alert('Password reset successfully and sent to their email.');
    } catch (error) {
      alert('Failed to reset password');
    }
  };

  const handleDeleteGuard = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this security account?')) return;
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      setGuards(guards.filter(g => g._id !== userId));
    } catch (error) {
      alert('Failed to delete security account');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-primary">Main Gate Security Control</h2>
        <p className="text-muted-foreground">Provision main gate security credentials, audit access parameters, and manage active guards.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Guard Form */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm h-fit">
          <div className="flex gap-2 items-center mb-4 border-b border-border pb-3">
            <Plus className="text-primary" size={20} />
            <h3 className="font-bold text-foreground">Add Security Account</h3>
          </div>
          <form onSubmit={handleSubmit(onCreateGuard)} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Guard Rajesh Kumar"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...register('name', { required: true })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
              <input
                type="email"
                placeholder="e.g. gate1@nith.ac.in"
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
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Assigned Gate Name</label>
              <input
                type="text"
                placeholder="e.g. Main Gate 1"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...register('assignedGate', { required: true })}
              />
            </div>
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors shadow-sm text-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Registering...' : 'Register Security'}
            </button>
          </form>
        </div>

        {/* Guard Directory */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
            <h3 className="font-semibold text-lg">Main Gate Security List</h3>
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
              {guards.length} Security Accounts
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-muted-foreground animate-pulse">Loading gate staff...</div>
          ) : guards.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No security accounts registered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Gate Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {guards.map(g => (
                    <tr key={g._id} className="hover:bg-secondary/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">{g.name}</td>
                      <td className="px-6 py-4">{g.email}</td>
                      <td className="px-6 py-4">{g.assignedLocation || 'N/A'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 border rounded-md text-[10px] font-bold uppercase tracking-wider ${g.status === 'Active' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                          {g.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 flex justify-end gap-2">
                        <button
                          onClick={() => handleStatusChange(g._id, g.status)}
                          title={g.status === 'Active' ? 'Suspend' : 'Activate'}
                          className={`p-2 rounded-lg transition-colors ${g.status === 'Active' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                        >
                          {g.status === 'Active' ? <Ban size={14} /> : <CheckCircle size={14} />}
                        </button>
                        <button
                          onClick={() => handlePasswordReset(g._id)}
                          title="Reset Password"
                          className="p-2 bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors"
                        >
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteGuard(g._id)}
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

export default AdminMainGate;
