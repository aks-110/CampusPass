import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { LogOut, Home, User, QrCode, FileText, Bell, Settings, Users, Building, ShieldAlert, BarChart3, Search, AlertTriangle, ShieldCheck, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logout } from '../redux/authSlice';
import { useTheme } from '../context/ThemeContext';

const MainLayout = ({ role }) => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [time, setTime] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  if (!isAuthenticated) return <Navigate to="/login" />;
  
  if (user?.role !== role) {
    return <Navigate to={`/${user?.role?.toLowerCase()}`} />;
  }

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const formatTime = (date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const day = String(date.getDate()).padStart(2, '0');
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strHours = String(hours).padStart(2, '0');
    
    return `${dayName}, ${day} ${monthName}, ${year} | ${strHours}:${minutes}:${seconds} ${ampm}`;
  };

  const getNavItems = () => {
    if (role === 'Student') return [
      { icon: <Home size={20} />, label: 'Home', path: '/student' },
      { icon: <User size={20} />, label: 'My Profile', path: '/student/profile' },
      { icon: <QrCode size={20} />, label: 'Gate Pass', path: '/student/pass' },
      { icon: <FileText size={20} />, label: 'History', path: '/student/history' },
      { icon: <Bell size={20} />, label: 'Notifications', path: '/student/notifications' },
      { icon: <Settings size={20} />, label: 'Settings', path: '/student/settings' },
    ];
    if (role === 'Warden') return [
      { icon: <Home size={20} />, label: 'Home', path: '/warden' },
      { icon: <Users size={20} />, label: 'Registration Requests', path: '/warden/requests' },
      { icon: <ShieldAlert size={20} />, label: 'Pending Gate Pass', path: '/warden/pending' },
      { icon: <ShieldCheck size={20} />, label: 'Approved', path: '/warden/approved' },
      { icon: <AlertTriangle size={20} />, label: 'Rejected', path: '/warden/rejected' },
      { icon: <Users size={20} />, label: 'Students', path: '/warden/students' },
      { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/warden/analytics' },
    ];
    if (role === 'Main Gate') return [
      { icon: <QrCode size={20} />, label: 'QR Scanner', path: '/main-gate' },
      { icon: <LogOut size={20} />, label: 'Today\'s Entries', path: '/main-gate/entries' },
      { icon: <LogOut size={20} className="rotate-180" />, label: 'Today\'s Exits', path: '/main-gate/exits' },
      { icon: <Search size={20} />, label: 'Search Student', path: '/main-gate/search' },
      { icon: <AlertTriangle size={20} />, label: 'Emergency Entry', path: '/main-gate/emergency' },
      { icon: <BarChart3 size={20} />, label: 'Gate Analytics', path: '/main-gate/analytics' },
    ];
    if (role === 'Admin') return [
      { icon: <BarChart3 size={20} />, label: 'Analytics', path: '/admin' },
      { icon: <Building size={20} />, label: 'Hostels', path: '/admin/hostels' },
      { icon: <ShieldCheck size={20} />, label: 'Wardens', path: '/admin/wardens' },
      { icon: <ShieldAlert size={20} />, label: 'Main Gate', path: '/admin/main-gate' },
      { icon: <Users size={20} />, label: 'Students', path: '/admin/students' },
      { icon: <FileText size={20} />, label: 'Reports', path: '/admin/reports' },
      { icon: <Settings size={20} />, label: 'Settings', path: '/admin/settings' },
    ];
    return [];
  };

  return (
    <div className="h-screen flex flex-col bg-[#f8fafc] text-foreground font-sans overflow-hidden">
      {/* Top Banner (Dark Blue) */}
      <div className="bg-[#0e274b] text-white py-1.5 px-4 md:px-6 flex flex-col sm:flex-row justify-between items-center text-[10px] sm:text-[11px] font-semibold tracking-wide border-b border-[#05162e] shrink-0 z-20">
        <div className="hidden sm:block">Ministry of Education, Government of India</div>
        <div className="font-mono">{formatTime(time)}</div>
      </div>

      {/* Main Logo & College Name Branding (White bg) */}
      <div className="bg-white py-3 px-4 md:px-6 border-b border-gray-200 shrink-0 z-20 shadow-sm flex items-center justify-between">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-3 md:gap-6 w-full">
          {/* Mobile Hamburger Toggle */}
          <button 
            className="md:hidden p-2 -ml-2 text-[#0a2f5c] hover:bg-gray-100 rounded-md transition-colors"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Hindi Title (Hidden on mobile) */}
          <div className="text-right hidden md:block flex-1">
            <h1 className="text-base font-bold text-[#0a2f5c] tracking-tight leading-snug">
              राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर
            </h1>
            <p className="text-[10px] text-gray-400 font-medium mt-0.5">
              हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005
            </p>
          </div>

          {/* Logo Center */}
          <div className="flex items-center justify-center shrink-0">
            <img 
              src="/nit_logo.svg" 
              alt="NITH Logo" 
              className="h-10 w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 object-contain drop-shadow-sm"
              onError={(e) => { e.target.src = "/favicon.svg"; }}
            />
          </div>

          {/* English Title */}
          <div className="text-left flex-1">
            <h1 className="text-sm sm:text-base font-bold text-[#0a2f5c] tracking-tight leading-snug">
              National Institute of Technology Hamirpur
            </h1>
            <p className="hidden sm:block text-[10px] text-gray-400 font-medium mt-0.5">
              Hamirpur, Himachal Pradesh (India) - 177 005
            </p>
          </div>
        </div>
      </div>

      {/* Sub Header Portal Banner (Blue bg) */}
      <div className="bg-[#1e4479] text-white py-2 text-center border-b-2 border-[#e5a93b] font-bold text-[10px] sm:text-xs tracking-widest uppercase shadow-sm shrink-0 z-20">
        CAMPUSPASS OUTPASS PORTAL
      </div>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Mobile Overlay Background */}
        <AnimatePresence>
          {isSidebarOpen && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 z-30 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <motion.aside 
          initial={false}
          animate={{ x: isSidebarOpen ? 0 : -280 }} // On mobile, toggle x.
          className={`absolute md:relative w-[260px] h-full bg-card border-r border-border flex flex-col shadow-2xl md:shadow-lg z-40 shrink-0 transition-transform duration-300 md:!transform-none ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
        >
          {/* Role Indicator Header */}
          <div className="p-4 border-b border-border bg-[#0a3366] text-white text-center shadow-inner shrink-0">
            <span className="text-[10px] font-black tracking-widest uppercase">{role} Portal</span>
          </div>
          
          <nav className="flex-1 p-3 sm:p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {getNavItems().map((item, idx) => {
              const isActive = location.pathname === item.path;
              return (
                <button 
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-3 w-full px-4 py-3 sm:py-2.5 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md font-bold scale-100' 
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground font-medium'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm sm:text-xs">{item.label}</span>
                </button>
              )
            })}
          </nav>

          <div className="p-4 border-t border-border bg-secondary/10 shrink-0">
            <div className="flex items-center gap-3 mb-4">
              {user?.photo ? (
                <img src={user.photo.startsWith('http') ? user.photo : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${user.photo}`} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-primary/20 shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="overflow-hidden flex-1">
                <p className="text-xs font-bold truncate text-foreground">{user?.name}</p>
                <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">{user?.role}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                  onClick={toggleTheme}
                  className="flex-1 flex items-center justify-center py-2.5 sm:py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-lg transition-colors shadow-sm text-xs"
                  title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
              >
                  {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button 
                  onClick={handleLogout}
                  className="flex-[3] flex items-center justify-center gap-2 py-2.5 sm:py-2 text-sm sm:text-xs font-bold text-destructive hover:bg-destructive hover:text-white border border-destructive/20 rounded-lg transition-colors shadow-sm"
              >
                  <LogOut size={16} className="sm:w-4 sm:h-4" /> Logout
              </button>
            </div>
          </div>
        </motion.aside>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col overflow-hidden bg-[#f1f5f9] w-full">
          <div className="flex-grow overflow-y-auto p-4 sm:p-6 md:p-8 custom-scrollbar">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
              <Outlet />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
