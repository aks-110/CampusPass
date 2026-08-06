import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strHours = String(hours).padStart(2, '0');
    
    return `${dayName}, ${day} ${monthName}, ${year} | ${strHours}:${minutes}:${seconds} ${ampm}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4f8] text-foreground font-sans">
      {/* Top Banner (Dark Blue) */}
      <div className="bg-[#0e274b] text-white py-2 px-4 md:px-8 flex flex-col md:flex-row justify-between items-center text-xs font-semibold tracking-wide border-b border-[#05162e]">
        <div>Ministry of Education, Government of India</div>
        <div className="mt-1 md:mt-0 font-mono">{formatTime(time)}</div>
      </div>

      {/* Main Logo & College Name Branding (White bg) */}
      <div className="bg-white py-4 px-4 md:px-8 border-b border-gray-200">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-center items-center gap-4 md:gap-8">
          {/* Hindi Title */}
          <div className="text-center md:text-right hidden md:block md:flex-1">
            <h1 className="text-lg md:text-xl font-bold text-[#0a2f5c] tracking-tight leading-snug">
              राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर
            </h1>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              हमीरपुर, हिमाचल प्रदेश (भारत) - 177 005
            </p>
          </div>

          {/* Logo Center */}
          <div className="flex items-center justify-center shrink-0">
            <img 
              src="https://res.cloudinary.com/dyoaxu1dc/image/upload/v1786030433/campuspass/c0rt5n02nhwlrra1wyna.jpg" 
              alt="NITH Logo" 
              className="bg-white rounded-full h-16 w-16 md:h-20 md:w-20 object-contain"
              onError={(e) => {
                e.target.src = "/favicon.svg";
              }}
            />
          </div>

          {/* English Title */}
          <div className="text-center md:text-left md:flex-1">
            {/* Show Hindi name on mobile view since we hide the left Hindi side on mobile */}
            <h2 className="text-base font-bold text-[#0a2f5c] tracking-tight leading-snug md:hidden block">
              राष्ट्रीय प्रौद्योगिकी संस्थान हमीरपुर
            </h2>
            <h1 className="text-lg md:text-xl font-bold text-[#0a2f5c] tracking-tight leading-snug mt-1 md:mt-0">
              National Institute of Technology Hamirpur
            </h1>
            <p className="text-[11px] text-gray-500 font-medium mt-0.5">
              Hamirpur, Himachal Pradesh (India) - 177 005
            </p>
          </div>
        </div>
      </div>

      {/* Sub Header Portal Banner (Blue bg) */}
      <div className="bg-[#1e4479] text-white py-3 text-center border-b-2 border-[#e5a93b] font-bold text-xs md:text-sm tracking-widest uppercase shadow-sm">
        CAMPUSPASS OUTPASS PORTAL
      </div>

      {/* Center Container with Gate Background */}
      <div 
        className="flex-1 flex items-center justify-center p-4 md:p-8 bg-cover bg-center relative"
        style={{ 
          backgroundImage: "url('https://res.cloudinary.com/dyoaxu1dc/image/upload/v1786031233/campuspass/hgckcdilhtlh2utivtny.jpg')",
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Dark overlay for readability and contrast */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />

        {/* Outlet for dynamic page content */}
        <div className="relative z-10 w-full flex justify-center items-center py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
