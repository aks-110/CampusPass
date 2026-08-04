import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useDispatch } from 'react-redux';
import { setCredentials, setLoading } from '../redux/authSlice';
import axiosInstance from '../utils/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';

const loginSchema = z.object({
  identifier: z.string().min(3, 'Roll Number or Email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      setError('');

      dispatch(setLoading(true));
      const response = await axiosInstance.post('/auth/login', data);
      
      dispatch(setCredentials({
        user: response.data.user
      }));
      
      const role = response.data.user.role;
      if (role === 'Student') navigate('/student');
      else if (role === 'Warden') navigate('/warden');
      else if (role === 'Main Gate') navigate('/main-gate');
      else if (role === 'Admin') navigate('/admin');
      else navigate('/');
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      dispatch(setLoading(false));
    }
  };

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-5 px-4">
      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg overflow-hidden"
      >
        {/* Card Header (NITH Navy Theme) */}
        <div className="bg-[#1e4479] text-white px-6 py-4 flex items-center gap-4 border-b-[3px] border-[#e5a93b]">
          <div className="p-2 border border-white/30 rounded-full bg-white/10 shrink-0">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide">User Login</h2>
            <p className="text-[11px] text-white/80">Authorized personnel only</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-white">
          {error && (
            <div className="mb-4 p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}



          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Email/Roll No */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="identifier">
                Email Address or Roll Number *
              </label>
              <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                <div className="pl-3 pr-2 text-gray-400 shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="identifier"
                  type="text"
                  className="w-full py-2.5 pr-3 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                  placeholder="Enter your registered credentials"
                  {...register('identifier')}
                />
              </div>
              {errors.identifier && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.identifier.message}</span>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="password">
                Password *
              </label>
              <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                <div className="pl-3 pr-2 text-gray-400 shrink-0">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="w-full py-2.5 pr-10 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.password.message}</span>}
            </div>



            {/* Login Button */}
            <button 
              disabled={isSubmitting}
              type="submit" 
              className="w-full mt-3 py-2.5 bg-[#1e4479] hover:bg-[#0e274b] text-white font-semibold rounded-md text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              {isSubmitting ? 'Verifying Account...' : 'Login to Portal'}
            </button>
          </form>

          {/* Registration & Forgot Password Footer Links */}
          <div className="flex justify-between items-center text-xs mt-6 pt-4 border-t border-gray-100">
            <Link to="/register" className="font-semibold text-[#1e4479] hover:text-[#0e274b] hover:underline transition-all">
              New Registration
            </Link>
            <Link to="/forgot-password" className="font-semibold text-[#1e4479] hover:text-[#0e274b] hover:underline transition-all">
              Forgot Password?
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Security Disclaimer */}
      <div className="text-[11px] text-gray-300 bg-black/30 backdrop-blur-sm p-3 rounded border border-white/10 flex gap-2 leading-relaxed">
        <ShieldAlert className="h-5 w-5 text-[#e5a93b] shrink-0 mt-0.5" />
        <span>
          This is a secure government portal. Unauthorized access is strictly prohibited and may be subject to legal action.
        </span>
      </div>
    </div>
  );
};

export default Login;
