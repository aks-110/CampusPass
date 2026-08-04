import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials, logout, setInitialized } from './redux/authSlice';
import axiosInstance from './utils/axiosInstance';
import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import { Toaster } from 'react-hot-toast';

// Public Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyPass from './pages/VerifyPass';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import StudentPass from './pages/StudentPass';
import StudentHistory from './pages/StudentHistory';
import StudentNotifications from './pages/StudentNotifications';
import StudentSettings from './pages/StudentSettings';

// Warden Pages
import WardenDashboard from './pages/WardenDashboard';
import WardenRequests from './pages/WardenRequests';
import WardenPending from './pages/WardenPending';
import WardenApproved from './pages/WardenApproved';
import WardenRejected from './pages/WardenRejected';
import WardenStudents from './pages/WardenStudents';
import WardenAnalytics from './pages/WardenAnalytics';

// Main Gate Pages
import MainGateDashboard from './pages/MainGateDashboard';
import MainGateEntries from './pages/MainGateEntries';
import MainGateExits from './pages/MainGateExits';
import MainGateSearch from './pages/MainGateSearch';
import MainGateEmergency from './pages/MainGateEmergency';
import MainGateAnalytics from './pages/MainGateAnalytics';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard';
import AdminHostels from './pages/AdminHostels';
import AdminWardens from './pages/AdminWardens';
import AdminMainGate from './pages/AdminMainGate';
import AdminStudents from './pages/AdminStudents';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';

function App() {
  const dispatch = useDispatch();
  const isInitialized = useSelector((state) => state.auth.isInitialized);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axiosInstance.get('/auth/me');
        dispatch(setCredentials({ user: response.data.user }));
      } catch (error) {
        dispatch(logout());
      } finally {
        dispatch(setInitialized(true));
      }
    };
    checkAuth();
  }, [dispatch]);

  if (!isInitialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f0f4f8]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1e4479]"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster 
        position="top-center"
        toastOptions={{
          className: 'text-sm font-semibold tracking-wide',
          style: {
            background: '#ffffff',
            color: '#1e4479',
            border: '1px solid #d2d6dc',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            borderRadius: '0.5rem',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-pass" element={<VerifyPass />} />
        </Route>

        {/* Student Routes */}
        <Route path="/student" element={<MainLayout role="Student" />}>
          <Route index element={<StudentDashboard />} />
          <Route path="profile" element={<StudentProfile />} />
          <Route path="pass" element={<StudentPass />} />
          <Route path="history" element={<StudentHistory />} />
          <Route path="notifications" element={<StudentNotifications />} />
          <Route path="settings" element={<StudentSettings />} />
        </Route>

        {/* Warden Routes */}
        <Route path="/warden" element={<MainLayout role="Warden" />}>
          <Route index element={<WardenDashboard />} />
          <Route path="requests" element={<WardenRequests />} />
          <Route path="pending" element={<WardenPending />} />
          <Route path="approved" element={<WardenApproved />} />
          <Route path="rejected" element={<WardenRejected />} />
          <Route path="students" element={<WardenStudents />} />
          <Route path="analytics" element={<WardenAnalytics />} />
        </Route>

        {/* Main Gate Routes */}
        <Route path="/main-gate" element={<MainLayout role="Main Gate" />}>
          <Route index element={<MainGateDashboard />} />
          <Route path="entries" element={<MainGateEntries />} />
          <Route path="exits" element={<MainGateExits />} />
          <Route path="search" element={<MainGateSearch />} />
          <Route path="emergency" element={<MainGateEmergency />} />
          <Route path="analytics" element={<MainGateAnalytics />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<MainLayout role="Admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="hostels" element={<AdminHostels />} />
          <Route path="wardens" element={<AdminWardens />} />
          <Route path="main-gate" element={<AdminMainGate />} />
          <Route path="students" element={<AdminStudents />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;
