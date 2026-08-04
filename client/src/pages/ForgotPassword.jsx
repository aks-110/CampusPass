import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid college email address'),
});

const ForgotPassword = () => {
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
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
        {/* Card Header */}
        <div className="bg-[#1e4479] text-white px-6 py-4 flex items-center gap-4 border-b-[3px] border-[#e5a93b]">
          <div className="p-2 border border-white/30 rounded-full bg-white/10 shrink-0">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide">Forgot Password</h2>
            <p className="text-[11px] text-white/80">Recover your portal password</p>
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

              {/* Email Address */}
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
                    placeholder="Enter your institutional email (e.g. name@nith.ac.in)"
                    {...register('email')}
                  />
                </div>
                {errors.email && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.email.message}</span>}
              </div>

              {/* Submit Button */}
              <button 
                disabled={isSubmitting}
                type="submit" 
                className="w-full mt-2 py-2.5 bg-[#7487a3] hover:bg-[#62758e] text-white font-semibold rounded text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? 'Sending Request...' : 'Send Reset Link'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                An email containing password reset instructions has been sent to your registered address. Please check your inbox and spam folders.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded transition-all"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          )}

          {/* Footer Back Link */}
          {!success && (
            <div className="text-center text-xs mt-6 pt-4 border-t border-gray-100">
              <Link to="/login" className="inline-flex items-center gap-1 font-semibold text-[#1e4479] hover:text-[#0e274b] hover:underline transition-all">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
