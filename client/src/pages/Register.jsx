import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosInstance from '../utils/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, Phone, BookOpen, Calendar, 
  Users, Home, Key, GraduationCap, Image, AlertCircle, ChevronRight, ChevronLeft,
  UserPlus, ShieldCheck, CheckCircle
} from 'lucide-react';

const HOSTELS = [
  'Kailash Boys Hostel',
  'Himgiri Boys Hostel',
  'Udaygiri Boys Hostel',
  'Neelkanth Boys Hostel',
  'Dhauladhar Boys Hostel',
  'Vindhyachal Boys Hostel',
  'Shivalik Boys Hostel',
  'Ambika Girls Hostel',
  'Parvati Girls Hostel',
  'Mani-Mahesh Girls Hostel',
  'Aravali Girls Hostel',
  'Satpura Hostel'
];

const baseSchema = {
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
};

const schemas = {
  Student: z.object({
    ...baseSchema,
    rollNumber: z.string().min(3, 'Roll Number is required'),
    phone: z.string().min(10, 'Valid Phone Number is required'),
    branch: z.string().min(2, 'Branch is required'),
    year: z.string().min(1, 'Year is required'),
    gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required' }),
    hostel: z.enum(HOSTELS, { required_error: 'Hostel is required' }),
    room: z.string().min(1, 'Room is required'),
    parentName: z.string().min(2, 'Parent Name is required'),
    parentEmail: z.string().email('Invalid Parent Email'),
    parentPhone: z.string().min(10, 'Valid Parent Phone is required'),
  }),
  Warden: z.object({
    ...baseSchema,
    assignedHostel: z.enum(HOSTELS, { required_error: 'Assigned Hostel is required' }),
  }),
  'Main Gate': z.object({
    ...baseSchema,
    assignedGate: z.string().min(1, 'Assigned Gate is required'),
  })
};

const InputField = ({ label, icon: Icon, register, name, error, type = "text", placeholder, options = null }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider" htmlFor={name}>
        {label} *
      </label>
      <div className={`relative flex items-center bg-[#fcfdfe] border ${error ? 'border-red-500 focus-within:ring-1 focus-within:ring-red-500' : 'border-[#d2d6dc] focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479]'} rounded transition-all`}>
        <div className={`pl-3 pr-2 shrink-0 ${error ? 'text-red-500' : 'text-gray-400'}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 relative w-full overflow-hidden">
          {options ? (
            <select
              className="w-full py-2.5 pr-3 text-sm bg-transparent outline-none text-gray-800 appearance-none bg-no-repeat"
              style={{ backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E")`, backgroundPosition: 'right 0.5rem center', backgroundSize: '1.5em 1.5em' }}
              {...register(name)}
            >
              <option value="" disabled hidden>Select {label}</option>
              {options.map(opt => (
                <option key={opt.value || opt} value={opt.value || opt}>{opt.label || opt}</option>
              ))}
            </select>
          ) : (
            <input
              id={name}
              type={type}
              className="w-full py-2.5 pr-3 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
              placeholder={placeholder}
              {...register(name)}
            />
          )}
        </div>
      </div>
      {error && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{error.message}</span>}
    </div>
  );
};

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('Student');
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [idCardFile, setIdCardFile] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const idCardInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  
  const { register, handleSubmit, reset, trigger, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schemas[role]),
    mode: 'onChange'
  });
 
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setStep(1);
    reset();
    setError('');
    setIdCardFile(null);
    setProfilePhotoFile(null);
  };

  const handleNext = async () => {
    let fieldsToValidate = [];
    if (step === 1) fieldsToValidate = ['name', 'email', 'password'];
    else if (step === 2) fieldsToValidate = ['rollNumber', 'phone', 'branch', 'year', 'gender'];
    else if (step === 3) {
      fieldsToValidate = ['hostel', 'room'];
      if (!profilePhotoFile) return setError('Profile Photo is required for student registration');
      if (!idCardFile) return setError('Student ID Card image is required');
    }
    
    setError('');
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };
 
  const onSubmit = async (data) => {
    try {
      setError('');
      let payload;
      let config = {};
 
      if (role === 'Student') {
        if (!profilePhotoFile) return setError('Profile Photo is required');
        if (!idCardFile) return setError('ID Card image is required');
        
        payload = new FormData();
        Object.keys(data).forEach(key => payload.append(key, data[key]));
        payload.append('role', role);
        payload.append('profilePhoto', profilePhotoFile);
        payload.append('idCard', idCardFile);
        config = { headers: { 'Content-Type': 'multipart/form-data' } };
      } else {
        payload = { ...data, role };
      }
 
      await axiosInstance.post('/auth/register', payload, config);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-[440px] flex flex-col gap-5 px-4 my-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg p-8 text-center relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Registration Submitted!</h2>
            <p className="text-sm text-gray-600 leading-relaxed mb-6">
              Your account is pending verification.<br/>
              {role === 'Student' 
                ? 'Your Hostel Warden will review your ID Card and approve your account soon.' 
                : 'The System Administrator will approve your account soon.'}
            </p>
            <div className="inline-block h-1 w-16 bg-green-500 rounded-full animate-pulse" />
            <p className="text-[11px] text-gray-400 mt-6 font-semibold uppercase tracking-wider">Redirecting to Sign In...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[480px] flex flex-col gap-5 px-4 my-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg overflow-hidden"
      >
        {/* Card Header */}
        <div className="bg-[#1e4479] text-white px-6 py-4 flex items-center gap-4 border-b-[3px] border-[#e5a93b]">
          <div className="p-2 border border-white/30 rounded-full bg-white/10 shrink-0">
            <UserPlus className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide">Create Account</h2>
            <p className="text-[11px] text-white/80">New User Registration</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-white">
          
          {/* Role Tabs */}
          <div className="flex bg-[#fcfdfe] p-1 rounded-md border border-[#d2d6dc] mb-6 shadow-sm">
            {['Student', 'Warden', 'Main Gate'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 text-xs py-2 rounded font-semibold transition-all duration-200 ${
                  role === r 
                    ? 'bg-[#1e4479] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Student Progress Indicator */}
          {role === 'Student' && (
            <div className="flex items-center justify-between mb-8 px-4 relative">
              <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gray-200 -translate-y-1/2 z-0" />
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="relative z-10 flex flex-col items-center gap-2 bg-white px-1">
                  <div 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors duration-300 ${
                      step >= s ? 'bg-[#1e4479] border-[#1e4479] text-white' : 'bg-[#fcfdfe] border-[#d2d6dc] text-gray-400'
                    }`}
                  >
                    {step > s ? <ShieldCheck className="h-3.5 w-3.5" /> : s}
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="mb-6 p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${role}-${step}`}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                
                {/* Step 1: Account Details */}
                {(role !== 'Student' || step === 1) && (
                  <>
                    <InputField label="Full Name" icon={User} name="name" register={register} error={errors.name} placeholder="John Doe" />
                    <InputField label="Official Email" icon={Mail} name="email" type="email" register={register} error={errors.email} placeholder="john@domain.com" />
                    <InputField label="Password" icon={Lock} name="password" type="password" register={register} error={errors.password} placeholder="••••••••" />
                    
                    {role === 'Warden' && (
                      <InputField label="Assigned Hostel" icon={Home} name="assignedHostel" register={register} error={errors.assignedHostel} options={HOSTELS} />
                    )}
                    
                    {role === 'Main Gate' && (
                      <InputField label="Assigned Gate Name" icon={Home} name="assignedGate" register={register} error={errors.assignedGate} placeholder="e.g. Main Gate" />
                    )}
                  </>
                )}

                {/* Student Step 2 */}
                {role === 'Student' && step === 2 && (
                  <>
                    <InputField label="Roll Number" icon={BookOpen} name="rollNumber" register={register} error={errors.rollNumber} placeholder="20CS101" />
                    <InputField label="Phone Number" icon={Phone} name="phone" register={register} error={errors.phone} placeholder="9876543210" />
                    <InputField label="Branch" icon={GraduationCap} name="branch" register={register} error={errors.branch} placeholder="Computer Science" />
                    <InputField label="Year of Study" icon={Calendar} name="year" register={register} error={errors.year} options={[{value: '1', label: '1st Year'}, {value: '2', label: '2nd Year'}, {value: '3', label: '3rd Year'}, {value: '4', label: '4th Year'}]} />
                    <InputField label="Gender" icon={Users} name="gender" register={register} error={errors.gender} options={['Male', 'Female', 'Other']} />
                  </>
                )}

                {/* Student Step 3 */}
                {role === 'Student' && step === 3 && (
                  <>
                    <InputField label="Hostel Name" icon={Home} name="hostel" register={register} error={errors.hostel} options={HOSTELS} />
                    <InputField label="Room Number" icon={Key} name="room" register={register} error={errors.room} placeholder="104-B" />
                    
                    <div className="bg-[#fcfdfe] border border-[#d2d6dc] p-4 rounded-md space-y-4 shadow-sm">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Image className="h-3.5 w-3.5 text-gray-400" /> Profile Photo *
                        </label>
                        <input 
                          type="file" accept="image/jpeg, image/png"
                          ref={profilePhotoInputRef}
                          onChange={(e) => setProfilePhotoFile(e.target.files[0])}
                          className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all cursor-pointer border border-gray-200 rounded p-1 bg-white"
                        />
                        {profilePhotoFile && <p className="text-[10px] text-green-600 font-semibold mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {profilePhotoFile.name}</p>}
                      </div>
                      
                      <hr className="border-gray-200" />
                      
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                          <Image className="h-3.5 w-3.5 text-gray-400" /> Student ID Card *
                        </label>
                        <input 
                          type="file" accept="image/jpeg, image/png"
                          ref={idCardInputRef}
                          onChange={(e) => setIdCardFile(e.target.files[0])}
                          className="w-full text-xs text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[11px] file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 transition-all cursor-pointer border border-gray-200 rounded p-1 bg-white"
                        />
                        {idCardFile && <p className="text-[10px] text-green-600 font-semibold mt-1 flex items-center gap-1"><CheckCircle className="h-3 w-3" /> {idCardFile.name}</p>}
                      </div>
                    </div>
                  </>
                )}

                {/* Student Step 4 */}
                {role === 'Student' && step === 4 && (
                  <>
                    <InputField label="Parent/Guardian Name" icon={User} name="parentName" register={register} error={errors.parentName} placeholder="Full Name" />
                    <InputField label="Parent Email" icon={Mail} name="parentEmail" type="email" register={register} error={errors.parentEmail} placeholder="parent@domain.com" />
                    <InputField label="Parent Phone" icon={Phone} name="parentPhone" register={register} error={errors.parentPhone} placeholder="9876543210" />
                  </>
                )}

              </motion.div>
            </AnimatePresence>

            {/* Navigation / Action Buttons */}
            <div className="flex gap-4 pt-4 mt-2 border-t border-gray-100">
              {role === 'Student' && step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-[0.4] py-2.5 bg-white border border-[#d2d6dc] hover:bg-gray-50 text-gray-800 font-semibold rounded-md text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              
              {role === 'Student' && step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2.5 bg-[#1e4479] hover:bg-[#0e274b] text-white font-semibold rounded-md text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  disabled={isSubmitting}
                  type="submit" 
                  className="flex-1 py-2.5 bg-[#1e4479] hover:bg-[#0e274b] text-white font-semibold rounded-md text-sm transition-all shadow-md active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : null}
                  {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                </button>
              )}
            </div>
          </form>

          {/* Footer Login Link */}
          <div className="flex justify-center items-center text-xs mt-6 pt-4 border-t border-gray-100">
            <span className="text-gray-500 mr-1">Already have an account?</span>
            <Link to="/login" className="font-semibold text-[#1e4479] hover:text-[#0e274b] hover:underline transition-all">
              Sign In
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Register;
