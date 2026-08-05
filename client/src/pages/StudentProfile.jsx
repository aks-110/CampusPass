import React from 'react';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { User, Mail, Phone, BookOpen, Calendar, MapPin, Building, Shield } from 'lucide-react';

const StudentProfile = () => {
  const { user } = useSelector((state) => state.auth);

  const detailItems = [
    { icon: <BookOpen className="text-primary" size={18} />, label: 'Branch', value: user?.branch || 'N/A' },
    { icon: <Calendar className="text-primary" size={18} />, label: 'Year', value: user?.year ? `${user.year} Year` : 'N/A' },
    { icon: <Building className="text-primary" size={18} />, label: 'Hostel', value: user?.hostel || 'N/A' },
    { icon: <MapPin className="text-primary" size={18} />, label: 'Room No.', value: user?.roomNo || 'N/A' },
    { icon: <Phone className="text-primary" size={18} />, label: 'Phone', value: user?.phone || 'N/A' },
    { icon: <Mail className="text-primary" size={18} />, label: 'Official Email', value: user?.email || 'N/A' },
    { icon: <Calendar className="text-primary" size={18} />, label: 'Registered On', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-primary">My Profile</h2>
        <p className="text-muted-foreground">Manage your identity and contact details.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col items-center text-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-r from-primary/10 to-primary/5" />
          
          <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden relative z-10 shadow-md mt-4">
            {user?.photo ? (
              <img src={user.photo.startsWith('http') ? user.photo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.photo.replace(/\\/g, '/')}`} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-primary text-3xl font-bold">
                {user?.name?.charAt(0)}
              </div>
            )}
          </div>

          <div className="z-10">
            <h3 className="text-xl font-bold text-foreground">{user?.name}</h3>
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-0.5">{user?.rollNumber || 'Roll Number'}</p>
          </div>

          <div className="w-full border-t border-border pt-4 flex justify-around text-sm">
            <div>
              <p className="font-bold text-primary">{user?.gender || 'N/A'}</p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Gender</p>
            </div>
            <div className="border-r border-border" />
            <div>
              <p className={`font-bold flex items-center gap-1 ${user?.status === 'Suspended' ? 'text-destructive' : 'text-primary'}`}>
                <Shield size={14} className={user?.status === 'Suspended' ? 'text-destructive' : 'text-emerald-500'} /> {user?.status || 'Active'}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase font-semibold">Status</p>
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="md:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-foreground border-b border-border pb-2">Academic & Hostel Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {detailItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-4 p-3 bg-secondary/10 rounded-xl">
                <div className="p-2.5 bg-background rounded-lg shadow-sm">{item.icon}</div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{item.label}</p>
                  <p className="font-bold text-foreground text-sm">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-6 space-y-4">
            <h4 className="text-sm font-bold text-foreground">Emergency Contacts</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 border border-border rounded-xl bg-background shadow-sm flex flex-col justify-between">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Parent/Guardian Name</p>
                <p className="font-bold text-foreground mt-1 text-sm md:text-base break-words">{user?.parentName || 'N/A'}</p>
              </div>
              <div className="p-4 border border-border rounded-xl bg-background shadow-sm flex flex-col justify-between">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Contact Phone</p>
                <p className="font-bold text-foreground mt-1 text-sm md:text-base break-words">{user?.parentPhone || 'N/A'}</p>
              </div>
              <div className="p-4 border border-border rounded-xl bg-background shadow-sm flex flex-col justify-between sm:col-span-2 md:col-span-1">
                <p className="text-[10px] text-muted-foreground uppercase font-bold">Parent Email</p>
                <p className="font-bold text-foreground mt-1 text-sm md:text-base break-words">{user?.parentEmail || 'N/A'}</p>
              </div>
            </div>
          </div>

          {user?.idCard && (
            <div className="border-t border-border pt-6 space-y-3">
              <h4 className="text-sm font-bold text-foreground">Verified College ID Card</h4>
              <a 
                href={user.idCard.startsWith('http') ? user.idCard : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.idCard.replace(/\\/g, '/')}`} 
                target="_blank" 
                rel="noreferrer"
                className="block max-w-sm rounded-xl overflow-hidden border border-border bg-white cursor-zoom-in group relative"
              >
                <img 
                  src={user.idCard.startsWith('http') ? user.idCard : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.idCard.replace(/\\/g, '/')}`} 
                  alt="College ID Card" 
                  className="w-full object-cover max-h-44 group-hover:scale-102 transition-transform duration-200" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                  View Original Image
                </div>
              </a>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentProfile;
