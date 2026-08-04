import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { KeyRound, Moon, Sun, CheckCircle, User } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTheme } from '../context/ThemeContext';
import { useDispatch, useSelector } from 'react-redux';
import { setCredentials } from '../redux/authSlice';
import axiosInstance from '../utils/axiosInstance';

const StudentSettings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { theme, toggleTheme } = useTheme();

  // Form 1: Password Form
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword, formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword } } = useForm();

  // Form 2: Profile Form
  const { register: registerProfile, handleSubmit: handleSubmitProfile, formState: { errors: errorsProfile, isSubmitting: isSubmittingProfile } } = useForm({
    defaultValues: {
      phone: user?.phone || ''
    }
  });

  const [passSuccess, setPassSuccess] = useState('');
  const [passError, setPassError] = useState('');

  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  const onPasswordSubmit = async (data) => {
    try {
      setPassError('');
      setPassSuccess('');
      if (data.newPassword !== data.confirmPassword) {
        setPassError('New passwords do not match');
        return;
      }
      await axiosInstance.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      setPassSuccess('Password updated successfully!');
      resetPassword();
    } catch (err) {
      setPassError(err.response?.data?.message || 'Failed to update password.');
    }
  };

  const onProfileSubmit = async (data) => {
    try {
      setProfileError('');
      setProfileSuccess('');

      const response = await axiosInstance.put('/auth/update-profile', data);

      // Update Redux state with updated user payload
      dispatch(setCredentials({
        user: response.data.user
      }));

      setProfileSuccess('Profile details updated successfully!');
    } catch (err) {
      setProfileError(err.response?.data?.message || 'Failed to update profile details.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-xl mx-auto space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold text-primary">Settings</h2>
        <p className="text-muted-foreground">Manage your portal preferences, contacts, and security.</p>
      </div>

      {/* Theme Toggling */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-foreground">Visual Preference</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Toggle between light mode and dark mode themes.</p>
        </div>
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 font-bold rounded-lg transition-colors shadow-sm text-sm"
        >
          {theme === 'light' ? (
            <>
              <Moon size={18} /> Dark Mode
            </>
          ) : (
            <>
              <Sun size={18} className="text-amber-500 animate-spin-slow" /> Light Mode
            </>
          )}
        </button>
      </div>

      {/* Profile Details Update Form */}
      {user?.role === 'Student' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
          <div className="flex gap-3 items-center border-b border-border pb-4">
            <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
              <User size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground">Profile Information</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Update your profile photo and contact mobile number.</p>
            </div>
          </div>

          {profileError && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="p-3 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex gap-2 items-center font-semibold">
              <CheckCircle size={16} /> {profileSuccess}
            </div>
          )}

          <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Profile Photo</label>
              <div className="flex items-center gap-4">
                {user?.photo ? (
                  <img 
                    src={user.photo.startsWith('http') ? user.photo : `http://localhost:5000/${user.photo.replace(/\\/g, '/')}`} 
                    alt="Current Profile" 
                    className="w-16 h-16 rounded-full object-cover border border-border shadow-sm"
                  />
                ) : (
                  <div className="w-16 h-16 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center border border-border shadow-sm">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-xs text-muted-foreground italic">
                  Profile photo can only be set during registration and cannot be modified.
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Phone Number</label>
              <input
                type="text"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                {...registerProfile('phone')}
              />
            </div>

            <button
              disabled={isSubmittingProfile}
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4 shadow-md"
            >
              {isSubmittingProfile ? 'Saving Details...' : 'Save Profile Information'}
            </button>
          </form>
        </div>
      )}

      {/* Change Password Form */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex gap-3 items-center border-b border-border pb-4">
          <div className="p-2.5 bg-primary/10 rounded-lg text-primary">
            <KeyRound size={20} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Update Password</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Keep your credentials secure by changing your password.</p>
          </div>
        </div>

        {passError && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {passError}
          </div>
        )}

        {passSuccess && (
          <div className="p-3 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex gap-2 items-center font-semibold">
            <CheckCircle size={16} /> {passSuccess}
          </div>
        )}

        <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Password</label>
            <input
              type="password"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              {...registerPassword('currentPassword', { required: 'Current password is required' })}
            />
            {errorsPassword.currentPassword && <span className="text-xs text-destructive">{errorsPassword.currentPassword.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Password</label>
            <input
              type="password"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              {...registerPassword('newPassword', { required: 'New password is required', minLength: { value: 6, message: 'Password must be at least 6 characters' } })}
            />
            {errorsPassword.newPassword && <span className="text-xs text-destructive">{errorsPassword.newPassword.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Confirm New Password</label>
            <input
              type="password"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              {...registerPassword('confirmPassword', { required: 'Please confirm your new password' })}
            />
            {errorsPassword.confirmPassword && <span className="text-xs text-destructive">{errorsPassword.confirmPassword.message}</span>}
          </div>

          <button
            disabled={isSubmittingPassword}
            type="submit"
            className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 mt-4"
          >
            {isSubmittingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default StudentSettings;
