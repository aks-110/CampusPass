import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axiosInstance from '../utils/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, Phone, BookOpen, Calendar, 
  Users, Home, Key, GraduationCap, Image, AlertCircle, ChevronRight, ChevronLeft 
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

// Base Schema
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

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('Student');
  const [step, setStep] = useState(1); // Used for multi-step Student registration
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [idCardFile, setIdCardFile] = useState(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState(null);
  const idCardInputRef = useRef(null);
  const profilePhotoInputRef = useRef(null);
  
  const { register, handleSubmit, reset, trigger, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schemas[role]),
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
    if (step === 1) {
      fieldsToValidate = ['name', 'email', 'password'];
    } else if (step === 2) {
      fieldsToValidate = ['rollNumber', 'phone', 'branch', 'year', 'gender'];
    } else if (step === 3) {
      fieldsToValidate = ['hostel', 'room'];
      
      // Manual validation for files
      if (!profilePhotoFile) {
        setError('Profile Photo is required for student registration');
        return;
      }
      if (!idCardFile) {
        setError('Student ID Card image is required');
        return;
      }
    }
    
    setError('');
    const isStepValid = await trigger(fieldsToValidate);
    if (isStepValid) {
      setStep(prev => prev + 1);
    }
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
        if (!profilePhotoFile) {
          setError('Profile Photo is required for students');
          return;
        }
        if (!idCardFile) {
          setError('ID Card image is required for students');
          return;
        }
        
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
      <div className="w-full max-w-[440px] px-4">
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg overflow-hidden p-8 text-center"
        >
          <div className="w-12 h-12 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
            <User className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Registration Submitted!</h2>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Your account is pending verification.<br/>
            {role === 'Student' 
              ? 'Your Hostel Warden will review your ID Card and approve your account soon.' 
              : 'The System Administrator will approve your account soon.'}
          </p>
          <div className="inline-block h-1 w-12 bg-green-500 rounded animate-pulse" />
          <p className="text-[10px] text-gray-400 mt-4">Redirecting to Sign In...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[440px] flex flex-col gap-5 px-4">
      {/* Registration Card */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full bg-white border border-[#d2d6dc] shadow-2xl rounded-lg overflow-hidden"
      >
        {/* Card Header (NITH Theme) */}
        <div className="bg-[#1e4479] text-white px-6 py-4 flex items-center gap-4 border-b-[3px] border-[#e5a93b]">
          <div className="p-2 border border-white/30 rounded-full bg-white/10 shrink-0">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide">New Registration</h2>
            <p className="text-[11px] text-white/80">Create your portal account</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 bg-white flex flex-col gap-4">
          {/* Role Tabs */}
          <div className="flex bg-slate-100 p-1 rounded border border-gray-200">
            {['Student', 'Warden', 'Main Gate'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 text-[11px] py-2 rounded font-bold transition-all cursor-pointer ${
                  role === r 
                    ? 'bg-[#1e4479] text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Student Progress Indicator */}
          {role === 'Student' && (
            <div className="flex justify-between items-center px-6 py-2 bg-slate-50 border border-gray-100 rounded">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-1.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step === s 
                      ? 'bg-[#1e4479] text-white' 
                      : step > s 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                  }`}>
                    {s}
                  </div>
                  {s < 4 && (
                    <div className={`w-8 h-[2px] ${step > s ? 'bg-emerald-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            
            {/* Dynamic Step Content */}
            <div className="flex flex-col gap-3.5">
              
              {/* Step 1: Account Details (Used for Warden/MainGate & Student Step 1) */}
              {(role !== 'Student' || step === 1) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3.5"
                >
                  {role === 'Student' && (
                    <div className="border-b border-gray-100 pb-1">
                      <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#1e4479]">Step 1: Account Details</h3>
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Full Name *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="Enter your full name"
                        {...register('name')}
                      />
                    </div>
                    {errors.name && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.name.message}</span>}
                  </div>

                  {/* Email Address */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Official Email *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="Enter your institutional email"
                        {...register('email')}
                      />
                    </div>
                    {errors.email && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.email.message}</span>}
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Password *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="Create a strong password"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        {...register('password')}
                      />
                    </div>
                    {errors.password && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.password.message}</span>}
                  </div>

                  {/* Warden assigned fields (single step) */}
                  {role === 'Warden' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Assigned Hostel *</label>
                      <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                        <div className="pl-3 pr-2 text-gray-400 shrink-0">
                          <Home className="h-4 w-4" />
                        </div>
                        <select 
                          className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800" 
                          {...register('assignedHostel')}
                        >
                          <option value="">Select Hostel to Manage</option>
                          {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      {errors.assignedHostel && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.assignedHostel.message}</span>}
                    </div>
                  )}

                  {/* Main Gate assigned fields (single step) */}
                  {role === 'Main Gate' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Assigned Gate Name *</label>
                      <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                        <div className="pl-3 pr-2 text-gray-400 shrink-0">
                          <Home className="h-4 w-4" />
                        </div>
                        <input
                          type="text"
                          className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                          placeholder="e.g. Main Gate / Secondary Gate"
                          {...register('assignedGate')}
                        />
                      </div>
                      {errors.assignedGate && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.assignedGate.message}</span>}
                    </div>
                  )}

                </motion.div>
              )}

              {/* Student Step 2: Academic details */}
              {role === 'Student' && step === 2 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3.5"
                >
                  <div className="border-b border-gray-100 pb-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#1e4479]">Step 2: Academic Details</h3>
                  </div>

                  {/* Roll Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Roll Number *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="e.g. 20CS101"
                        {...register('rollNumber')}
                      />
                    </div>
                    {errors.rollNumber && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.rollNumber.message}</span>}
                  </div>

                  {/* Phone Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone Number *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="Enter 10-digit phone number"
                        {...register('phone')}
                      />
                    </div>
                    {errors.phone && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.phone.message}</span>}
                  </div>

                  {/* Branch */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Branch *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <GraduationCap className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="e.g. Computer Science"
                        {...register('branch')}
                      />
                    </div>
                    {errors.branch && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.branch.message}</span>}
                  </div>

                  {/* Year */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Year of Study *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <select 
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800" 
                        {...register('year')}
                      >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                    {errors.year && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.year.message}</span>}
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Gender *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Users className="h-4 w-4" />
                      </div>
                      <select 
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800" 
                        {...register('gender')}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    {errors.gender && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.gender.message}</span>}
                  </div>
                </motion.div>
              )}

              {/* Student Step 3: Hostel details & media */}
              {role === 'Student' && step === 3 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3.5"
                >
                  <div className="border-b border-gray-100 pb-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#1e4479]">Step 3: Hostel & ID Uploads</h3>
                  </div>

                  {/* Hostel Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Hostel Name *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Home className="h-4 w-4" />
                      </div>
                      <select 
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800" 
                        {...register('hostel')}
                      >
                        <option value="">Select Hostel</option>
                        {HOSTELS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    {errors.hostel && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.hostel.message}</span>}
                  </div>

                  {/* Room Number */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Room Number *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Key className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="e.g. 104-B"
                        {...register('room')}
                      />
                    </div>
                    {errors.room && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.room.message}</span>}
                  </div>

                  {/* Profile Photo */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Image className="h-3.5 w-3.5" /> Profile Photo *
                    </label>
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png"
                      ref={profilePhotoInputRef}
                      onChange={(e) => setProfilePhotoFile(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-gray-50 hover:file:bg-gray-100"
                    />
                    {profilePhotoFile && (
                      <span className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ Selected: {profilePhotoFile.name}</span>
                    )}
                  </div>

                  {/* ID Card */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                      <Image className="h-3.5 w-3.5" /> Student ID Card *
                    </label>
                    <input 
                      type="file" 
                      accept="image/jpeg, image/png"
                      ref={idCardInputRef}
                      onChange={(e) => setIdCardFile(e.target.files[0])}
                      className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-gray-300 file:text-xs file:font-semibold file:bg-gray-50 hover:file:bg-gray-100"
                    />
                    {idCardFile && (
                      <span className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ Selected: {idCardFile.name}</span>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Student Step 4: Parent Details */}
              {role === 'Student' && step === 4 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col gap-3.5"
                >
                  <div className="border-b border-gray-100 pb-1">
                    <h3 className="text-[10px] font-bold uppercase tracking-wider text-[#1e4479]">Step 4: Parent/Guardian Details</h3>
                  </div>

                  {/* Parent Name */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Parent/Guardian Name *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <User className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="Enter parent's full name"
                        {...register('parentName')}
                      />
                    </div>
                    {errors.parentName && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.parentName.message}</span>}
                  </div>

                  {/* Parent Email */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Parent Email *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="Enter parent's email"
                        {...register('parentEmail')}
                      />
                    </div>
                    {errors.parentEmail && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.parentEmail.message}</span>}
                  </div>

                  {/* Parent Phone */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Parent Phone *</label>
                    <div className="relative flex items-center bg-[#fcfdfe] border border-[#d2d6dc] rounded focus-within:border-[#1e4479] focus-within:ring-1 focus-within:ring-[#1e4479] transition-all">
                      <div className="pl-3 pr-2 text-gray-400 shrink-0">
                        <Phone className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        className="w-full py-2.5 text-sm bg-transparent outline-none text-gray-800 placeholder:text-gray-400"
                        placeholder="Enter parent's phone number"
                        {...register('parentPhone')}
                      />
                    </div>
                    {errors.parentPhone && <span className="text-[10px] text-red-600 font-semibold mt-0.5">{errors.parentPhone.message}</span>}
                  </div>
                </motion.div>
              )}

            </div>

            {/* Navigation / Action Buttons */}
            <div className="flex gap-3 mt-4">
              {role === 'Student' && step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
              )}
              
              {role === 'Student' && step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 py-2.5 bg-[#1e4479] hover:bg-[#0e274b] text-white font-semibold rounded text-sm transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button 
                  disabled={isSubmitting}
                  type="submit" 
                  className="flex-1 py-2.5 bg-[#7487a3] hover:bg-[#62758e] text-white font-semibold rounded text-sm transition-all shadow-md active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? 'Registering Account...' : `Register as ${role}`}
                </button>
              )}
            </div>

          </form>

          {/* Footer Back Link */}
          <div className="text-center text-xs mt-2 pt-4 border-t border-gray-100">
            Already have a portal account?{' '}
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
