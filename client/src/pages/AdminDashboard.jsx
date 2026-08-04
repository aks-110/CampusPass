import React, { useEffect, useState } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { Check, X, Users, Building, BarChart3, ShieldAlert, KeyRound, Ban, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('Analytics');
  const [loading, setLoading] = useState(true);
  
  // Data States
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Create Admin State
  const [isCreateAdminOpen, setIsCreateAdminOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', phone: '', password: '' });
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // Fetch Data based on tab
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'Analytics') {
        const { data } = await axiosInstance.get('/reports/stats');
        setStats(data);
      } else if (activeTab === 'Approvals') {
        const { data } = await axiosInstance.get('/admin/pending-users');
        setPendingUsers(data);
      } else if (activeTab === 'Users') {
        const { data } = await axiosInstance.get('/admin/users');
        setUsers(data);
      } else if (activeTab === 'Hostels') {
        const { data } = await axiosInstance.get('/hostels');
        setHostels(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Handlers
  const handleApproval = async (userId, action) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/${action}`);
      setPendingUsers(pendingUsers.filter(u => u._id !== userId));
    } catch (err) { alert('Failed to process approval'); }
  };

  const handleUserStatus = async (userId, currentStatus) => {
    try {
      await axiosInstance.put(`/admin/users/${userId}/status`, { isActive: !currentStatus });
      fetchData(); // Refresh list
    } catch (err) { alert('Failed to update status'); }
  };

  const handlePasswordReset = async (userId) => {
    if (!window.confirm('Are you sure you want to reset this user\'s password?')) return;
    try {
      await axiosInstance.put(`/admin/users/${userId}/reset-password`);
      alert('Password reset successfully and emailed to user.');
    } catch (err) { alert('Failed to reset password'); }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('PERMANENTLY delete this user?')) return;
    try {
      await axiosInstance.delete(`/admin/users/${userId}`);
      setUsers(users.filter(u => u._id !== userId));
    } catch (err) { alert('Failed to delete user'); }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setIsSubmittingAdmin(true);
    try {
      await axiosInstance.post('/admin/create-admin', newAdmin);
      alert('Administrator created successfully!');
      setIsCreateAdminOpen(false);
      setNewAdmin({ name: '', email: '', phone: '', password: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setIsSubmittingAdmin(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-primary">Master Control Center</h2>
        <p className="text-muted-foreground">Manage the entire CampusPass ecosystem.</p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-secondary/20 p-1 rounded-lg w-fit overflow-x-auto">
        {[
          { id: 'Analytics', icon: <BarChart3 size={16} /> },
          { id: 'Approvals', icon: <ShieldAlert size={16} /> },
          { id: 'Users', icon: <Users size={16} /> },
          { id: 'Hostels', icon: <Building size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-md transition-all text-sm font-semibold flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon} {tab.id}
            {tab.id === 'Approvals' && pendingUsers.length > 0 && activeTab !== tab.id && (
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground animate-pulse border border-border rounded-xl">Loading System Data...</div>
      ) : (
        <AnimatePresence mode="wait">
          
          {/* ANALYTICS TAB */}
          {activeTab === 'Analytics' && stats && (
            <motion.div key="analytics" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground uppercase">Pending Approvals</p>
                  <p className="text-4xl font-bold mt-2 text-primary">{stats.pendingApprovals}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground uppercase">Passes Issued Today</p>
                  <p className="text-4xl font-bold mt-2 text-emerald-600">{stats.passesToday}</p>
                </div>
                <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground uppercase">Students Outside</p>
                  <p className="text-4xl font-bold mt-2 text-rose-600">{stats.outsideStudents}</p>
                </div>
              </div>

              <div className="bg-card border border-border p-6 rounded-xl shadow-sm h-80">
                <h3 className="font-semibold mb-4">Gate Activity (Peak Hours)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.gateActivity}>
                    <XAxis dataKey="_id" tickFormatter={(val) => `${val}:00`} />
                    <YAxis />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* APPROVALS TAB */}
          {activeTab === 'Approvals' && (
             <motion.div key="approvals" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
               {/* Same table logic as previous AdminDashboard... */}
               <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">Staff Account Approvals</h3>
                  </div>
                  {pendingUsers.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <Check size={48} className="opacity-20" />
                      <p>All clear! No pending registrations.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-secondary/5 text-muted-foreground uppercase text-xs">
                          <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {pendingUsers.map(user => (
                            <tr key={user._id} className="hover:bg-secondary/5 transition-colors">
                              <td className="px-6 py-4 font-medium">{user.name} <br/><span className="text-xs text-muted-foreground">{user.email}</span></td>
                              <td className="px-6 py-4 font-bold">
                                {user.role}
                                {user.assignedTo && <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">Assigned: {user.assignedTo}</span>}
                              </td>
                              <td className="px-6 py-4 flex justify-end gap-2">
                                <button onClick={() => handleApproval(user._id, 'approve')} className="p-2 bg-emerald-500/10 text-emerald-600 rounded-md hover:bg-emerald-500 hover:text-white transition-colors"><Check size={18} /></button>
                                <button onClick={() => handleApproval(user._id, 'reject')} className="p-2 bg-destructive/10 text-destructive rounded-md hover:bg-destructive hover:text-white transition-colors"><X size={18} /></button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
               </div>
             </motion.div>
          )}

          {/* USERS TAB */}
          {activeTab === 'Users' && (
             <motion.div key="users" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
               <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-border bg-secondary/10 flex justify-between items-center">
                    <h3 className="font-semibold text-lg">System Users</h3>
                    <div className="flex gap-3">
                      <select 
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                        className="bg-white border border-border rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                      >
                        <option value="All">All Categories</option>
                        <option value="Student">Students</option>
                        <option value="Warden">Wardens</option>
                        <option value="Main Gate">Main Gate Guards</option>
                        <option value="Admin">Administrators</option>
                      </select>
                      <button 
                        onClick={() => setIsCreateAdminOpen(true)}
                        className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-primary/90 transition-all"
                      >
                        + Add Admin
                      </button>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-secondary/5 text-muted-foreground uppercase text-[10px] tracking-wider">
                        <tr>
                          <th className="px-4 py-3">User</th>
                          <th className="px-4 py-3">Role</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {(roleFilter === 'All' ? users : users.filter(u => u.role === roleFilter)).map(user => (
                          <tr key={user._id} className="hover:bg-secondary/5 transition-colors">
                            <td className="px-4 py-3 font-medium">{user.name} <br/><span className="text-xs text-muted-foreground font-normal">{user.email}</span></td>
                            <td className="px-4 py-3 font-semibold text-xs">{user.role}</td>
                            <td className="px-4 py-3">
                               <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-destructive/10 text-destructive'}`}>
                                 {user.status === 'Active' ? 'Active' : 'Suspended'}
                               </span>
                            </td>
                            <td className="px-4 py-3 flex justify-end gap-1">
                               <button onClick={() => handleUserStatus(user._id, user.status === 'Active')} title={user.status === 'Active' ? "Suspend" : "Activate"} className={`p-1.5 rounded-md transition-colors ${user.status === 'Active' ? 'bg-amber-100 text-amber-700 hover:bg-amber-500 hover:text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-500 hover:text-white'}`}>
                                 {user.status === 'Active' ? <Ban size={16} /> : <Check size={16} />}
                               </button>
                               <button onClick={() => handlePasswordReset(user._id)} title="Reset Password" className="p-1.5 bg-blue-100 text-blue-700 hover:bg-blue-600 hover:text-white rounded-md transition-colors"><KeyRound size={16} /></button>
                               <button onClick={() => handleDeleteUser(user._id)} title="Delete User" className="p-1.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white rounded-md transition-colors"><Trash2 size={16} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
             </motion.div>
          )}

          {/* HOSTELS TAB Placeholder */}
          {activeTab === 'Hostels' && (
             <motion.div key="hostels" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-card border border-border p-8 rounded-xl shadow-sm text-center text-muted-foreground">
               <Building size={48} className="mx-auto mb-4 opacity-20" />
               <p>Hostel Management UI<br/>(Coming in next iteration)</p>
             </motion.div>
          )}

        </AnimatePresence>
      )}

      {/* Create Admin Modal */}
      <AnimatePresence>
        {isCreateAdminOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-4 border-b border-border flex justify-between items-center bg-secondary/10">
                <h3 className="font-bold text-lg">Create New Administrator</h3>
                <button onClick={() => setIsCreateAdminOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Full Name *</label>
                  <input required type="text" value={newAdmin.name} onChange={e => setNewAdmin({...newAdmin, name: e.target.value})} className="w-full p-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Email Address *</label>
                  <input required type="email" value={newAdmin.email} onChange={e => setNewAdmin({...newAdmin, email: e.target.value})} className="w-full p-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="admin@nith.ac.in" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Phone Number</label>
                  <input type="text" value={newAdmin.phone} onChange={e => setNewAdmin({...newAdmin, phone: e.target.value})} className="w-full p-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="+91 XXXXX XXXXX" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">Secure Password *</label>
                  <input required minLength={6} type="password" value={newAdmin.password} onChange={e => setNewAdmin({...newAdmin, password: e.target.value})} className="w-full p-2 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20" placeholder="••••••••" />
                </div>
                
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setIsCreateAdminOpen(false)} className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary/50 rounded-md">Cancel</button>
                  <button type="submit" disabled={isSubmittingAdmin} className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50">
                    {isSubmittingAdmin ? 'Creating...' : 'Create Admin Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AdminDashboard;
