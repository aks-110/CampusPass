import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, AlertCircle, CheckCircle, ArrowLeft, Key } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid college email address'),
});

const ForgotPassword = () => {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onChange"
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      const response = await axiosInstance.post('/auth/forgot-password', data);
      setSuccess(response.data.message || 'Password reset link sent successfully! Check your email inbox.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-5 px-4">
      {/* Forgot Password Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg overflow-hidden"
      >
        {/* Card Header (NITH Navy Theme) */}
        <div className="bg-[#1e4479] text-white px-6 py-4 flex items-center gap-4 border-b-[3px] border-[#e5a93b]">
          <div className="p-2 border border-white/30 rounded-full bg-white/10 shrink-0">
            <Key className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide">Reset Password</h2>
            <p className="text-[11px] text-white/80">Recover access to your account</p>
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

          {success && (
            <div className="mb-4 p-3 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <p className="text-xs text-gray-500 leading-relaxed mb-1">
                Enter your registered college email address below. We will send you an email with a secure link to reset your account password.
              </p>

              {/* Identifier Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="email">
                  Registered Email Address *
                </label>
                <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                  <div className="pl-3 pr-2 text-gray-400 shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    className="w-full py-2.5 pr-3 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                    placeholder="Enter your email"
                    {...register('email')}
                  />
                </div>
                {errors.email && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.email.message}</span>}
              </div>

              {/* Submit Button */}
              <button 
                disabled={isSubmitting}
                type="submit" 
                className="w-full mt-3 py-2.5 bg-[#1e4479] hover:bg-[#0e274b] text-white font-semibold rounded-md text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                {isSubmitting ? 'Sending Link...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="py-2">
              <Link
                to="/login"
                className="w-full py-2.5 bg-white border border-[#d2d6dc] hover:bg-gray-50 text-gray-800 font-semibold rounded-md text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Sign In
              </Link>
            </div>
          )}

          {!success && (
            <div className="flex justify-center items-center text-xs mt-6 pt-4 border-t border-gray-100">
              <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-[#1e4479] hover:text-[#0e274b] hover:underline transition-all group">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
                Return to Login
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
