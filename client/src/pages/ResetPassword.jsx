import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import axiosInstance from '../utils/axiosInstance';

const resetPasswordSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm Password must be at least 6 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      if (!token) {
        setError('Token is missing in the reset URL. Please request a new link.');
        return;
      }
      const response = await axiosInstance.post(`/auth/reset-password/${token}`, {
        password: data.password
      });
      setSuccess(response.data.message || 'Password reset successful! You can now log in.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link might be invalid or expired.');
    }
  };

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-5 px-4">
      {/* Reset Password Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg overflow-hidden"
      >
        {/* Card Header */}
        <div className="bg-[#1e4479] text-white px-6 py-4 flex items-center gap-4 border-b-[3px] border-[#e5a93b]">
          <div className="p-2 border border-white/30 rounded-full bg-white/10 shrink-0">
            <Lock className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide">Reset Password</h2>
            <p className="text-[11px] text-white/80">Set a new portal password</p>
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

          {!token && !success && (
            <div className="mb-4 p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Invalid URL. Password reset token is missing. Please click the link sent to your email.</span>
            </div>
          )}

          {!success ? (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <p className="text-xs text-gray-500 leading-relaxed mb-1">
                Please enter and confirm your new account password below. Once submitted, your password will be updated immediately.
              </p>

              {/* New Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="password">
                  New Password *
                </label>
                <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                  <div className="pl-3 pr-2 text-gray-400 shrink-0">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="w-full py-2.5 pr-10 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                    placeholder="Enter new password (min. 6 chars)"
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

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider" htmlFor="confirmPassword">
                  Confirm Password *
                </label>
                <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                  <div className="pl-3 pr-2 text-gray-400 shrink-0">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    className="w-full py-2.5 pr-10 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                    placeholder="Re-type your password"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.confirmPassword.message}</span>}
              </div>

              {/* Submit Button */}
              <button 
                disabled={isSubmitting || !token}
                type="submit" 
                className="w-full mt-3 py-2.5 bg-[#1e4479] hover:bg-[#0e274b] text-white font-semibold rounded-md text-sm transition-all shadow-md hover:shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}
                {isSubmitting ? 'Resetting Password...' : 'Reset Password'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                Your password has been successfully reset. You can now use your new password to log in.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1e4479] hover:bg-[#0e274b] text-white text-sm font-semibold rounded transition-all shadow-md"
              >
                Go to Sign In
              </Link>
            </div>
          )}

          {/* Footer Back Link */}
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

export default ResetPassword;
