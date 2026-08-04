import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import axiosInstance from '../utils/axiosInstance';

const MainGateEmergency = () => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    try {
      setError('');
      setSuccess('');
      
      const payload = {
        rollNumber: data.rollNumber,
        purpose: data.purpose,
        destination: data.destination,
        expectedReturnDate: data.returnDate ? new Date(`${data.returnDate}T${data.returnTime}`) : undefined
      };

      await axiosInstance.post('/gate/emergency', payload);
      setSuccess(`Emergency Exit successfully logged for student ${data.rollNumber}!`);
      reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit emergency log. Check Student Roll Number.');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-primary">Emergency Entry/Exit Log</h2>
        <p className="text-muted-foreground">Bypass standard approval workflow and immediately record student gate movement in critical emergencies.</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6">
        <div className="flex gap-3 items-center border-b border-border pb-4">
          <div className="p-2.5 bg-rose-500/10 rounded-lg text-rose-600 animate-pulse">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Manual Gate Override</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Every emergency action is logged instantly to the Admin Audit Logs.</p>
          </div>
        </div>

        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 text-sm text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex gap-2 items-center font-semibold">
            <CheckCircle size={16} /> {success}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Student Roll Number (Required)</label>
            <input
              type="text"
              placeholder="e.g. 20CS101"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all uppercase"
              {...register('rollNumber', { required: 'Student Roll Number is required' })}
            />
            {errors.rollNumber && <span className="text-xs text-destructive">{errors.rollNumber.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Destination (Required)</label>
            <input
              type="text"
              placeholder="e.g. Regional Hospital"
              className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
              {...register('destination', { required: 'Emergency destination is required' })}
            />
            {errors.destination && <span className="text-xs text-destructive">{errors.destination.message}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Emergency Reason/Remarks (Required)</label>
            <textarea
              rows={3}
              placeholder="Provide a detailed explanation of the emergency bypass..."
              className="w-full rounded-md border border-input bg-transparent p-3 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all resize-none"
              {...register('purpose', { required: 'Emergency reason is required' })}
            />
            {errors.purpose && <span className="text-xs text-destructive">{errors.purpose.message}</span>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expected Return Date</label>
              <input
                type="date"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                {...register('returnDate')}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Return Time</label>
              <input
                type="time"
                className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none transition-all"
                {...register('returnTime')}
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition-colors disabled:opacity-50 mt-4 shadow-md flex items-center justify-center gap-2"
          >
            {isSubmitting ? 'Logging...' : 'Confirm Emergency Departure'}
          </button>
        </form>
      </div>
    </motion.div>
  );
};

export default MainGateEmergency;
