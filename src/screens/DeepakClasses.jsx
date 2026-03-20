import React, { useState, useEffect } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { Phone, MapPin, Award, ArrowRight, UserCheck, Star } from 'lucide-react';

const students = [
  { name: 'Aarav Gupta', score: '99.8%ile', exam: 'JEE Main', photo: 'AG' },
  { name: 'Sneha Sharma', score: '99.5%ile', exam: 'JEE Main', photo: 'SS' },
  { name: 'Rohan Singh', score: '94.8%', exam: 'CBSE 12th', photo: 'RS' },
  { name: 'Priya Verma', score: '94.2%', exam: 'CBSE 12th', photo: 'PV' },
];

const Counter = ({ from, to, duration, prefix = '', suffix = '' }) => {
  const [count, setCount] = useState(from);
  const ref = React.useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      let start = null;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / (duration * 1000), 1);
        setCount(Math.floor(progress * (to - from) + from));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }
  }, [inView, from, to, duration]);

  return (
    <span ref={ref} className="font-heading font-bold">
      {prefix}{count}{suffix}
    </span>
  );
};

const ResultGallery = () => {
  return (
    <section className="py-16 md:py-24 bg-gray-50 px-4 border-t border-gray-100">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-heading font-black text-deepak-purple mb-4"
          >
            RESULTS 2024
          </motion.h2>
          <div className="w-24 h-1 bg-deepak-red mx-auto rounded-full"></div>
          <p className="mt-6 text-gray-600 max-w-2xl mx-auto font-medium">
            Once again, our students have proven that hard work and the right guidance lead to spectacular outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {students.map((student, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] overflow-hidden transform hover:-translate-y-2 hover:shadow-[0_20px_50px_rgba(72,61,139,0.12)] transition-all duration-300 border-b-4 border-deepak-purple"
            >
              <div className="p-8 text-center relative">
                {/* Red/Purple border for profile photo */}
                <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-deepak-red to-deepak-purple rounded-full p-1 mb-4 shadow-lg">
                  <div className="w-full h-full bg-white rounded-full flex items-center justify-center text-3xl font-bold font-heading text-deepak-purple">
                    {student.photo}
                  </div>
                </div>
                <h3 className="text-xl font-bold font-heading text-gray-800">{student.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{student.exam}</p>
                <div className="inline-block bg-deepak-yellow text-gray-900 font-bold px-4 py-1 rounded-full text-lg shadow">
                  {student.score}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default function DeepakClasses() {
  return (
    <div className="min-h-screen font-sans bg-white selection:bg-deepak-yellow selection:text-black">
      
      {/* 100% Fee Refund Banner */}
      <div className="bg-gradient-to-r from-deepak-red to-deepak-purple text-white text-center py-3 px-4 shadow-md relative z-50">
        <p className="font-bold tracking-wide flex items-center justify-center gap-2 text-sm sm:text-base">
          <Award size={20} className="text-deepak-yellow" />
          <span className="text-deepak-yellow uppercase tracking-wider">Launch Offer:</span> 100% Fee Refund on Selection!
          <Award size={20} className="text-deepak-yellow" />
        </p>
      </div>

      {/* Hero Section */}
      <header className="relative pt-20 pb-32 lg:pt-32 lg:pb-40 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-blue-50/50"></div>
          {/* subtle pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#483D8B 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-deepak-purple/10 text-deepak-purple px-5 py-2.5 rounded-full font-bold text-sm mb-6 border border-deepak-purple/20 shadow-sm shadow-deepak-purple/5">
              <Star size={18} className="text-deepak-yellow fill-deepak-yellow" />
              Give Your Child the Best Start
            </div>
            
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black font-heading tracking-tighter text-gray-900 mb-8 leading-[1.1]">
              DEEPAK <span className="text-deepak-red">CLASSES</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 font-medium leading-relaxed">
              Agra's most trusted institute for IIT-JEE & Board Excellence. Join the legacy of toppers in Khandari.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="w-full sm:w-auto px-8 py-4 bg-deepak-red hover:bg-red-800 text-white font-bold rounded-2xl shadow-xl shadow-deepak-red/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
                Admissions Open 2025 <ArrowRight size={20} />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-white text-deepak-purple border-2 border-deepak-purple/20 hover:border-deepak-purple/40 hover:bg-deepak-purple/5 font-bold rounded-2xl shadow-sm transition-all text-lg flex items-center justify-center gap-2">
                Download Brochure
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Stats Section with Negative Margin for Stacking Flow (No Overlapping Absolute) */}
      <div className="relative z-20 px-4 -mt-12 md:-mt-24 mb-16">
        <div className="max-w-6xl mx-auto bg-white/95 backdrop-blur-md rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(72,61,139,0.15)] p-8 md:p-12 border border-gray-100/50 hidden md:block relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-deepak-yellow/20 to-transparent rounded-bl-full opacity-50"></div>
          
          <div className="grid grid-cols-3 gap-8 divide-x-2 divide-gray-100">
            <div className="text-center px-4 hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-black font-heading text-deepak-purple mb-2 drop-shadow-sm">
                <Counter from={0} to={15} duration={2} suffix="+" />
              </div>
              <div className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-3">Years of Excellence</div>
            </div>
            <div className="text-center px-4 hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-black font-heading text-deepak-red mb-2 drop-shadow-sm">
                <Counter from={0} to={5000} duration={2.5} suffix="+" />
              </div>
              <div className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-3">Selections given</div>
            </div>
            <div className="text-center px-4 hover:scale-105 transition-transform duration-300">
              <div className="text-5xl font-black font-heading text-deepak-yellow mb-2 drop-shadow-sm">
                <Counter from={0} to={99} duration={2} suffix="%" />ile
              </div>
              <div className="text-gray-500 font-bold uppercase tracking-widest text-sm mt-3">Highest Score JEE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Result Gallery */}
      <ResultGallery />

      {/* QR Code / Call to Action */}
      <section className="py-24 bg-deepak-purple text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-deepak-red rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-deepak-yellow rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform -translate-x-1/2 translate-y-1/2"></div>
        
        <div className="max-w-5xl mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-6">Ready to secure your future?</h2>
            <p className="text-lg text-white/80 mb-8 max-w-lg">
              Visit our Khandari campus or scan the QR code to chat with our counselors directly on WhatsApp.
            </p>
            <div className="flex items-center justify-center md:justify-start gap-4 text-white/90">
              <MapPin size={24} className="text-deepak-yellow" />
              <span>Near Seth Padam Chand Jain College, Khandari, Agra</span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center gap-4 transform rotate-1 hover:rotate-0 transition-transform cursor-pointer">
            <div className="w-48 h-48 bg-gray-100 rounded-xl flex items-center justify-center border-4 border-dashed border-gray-300">
              <p className="text-gray-400 font-medium text-center px-4">QR Code Placeholder<br/>(Link to WhatsApp)</p>
            </div>
            <p className="text-deepak-purple font-bold text-center">Scan to Connect!</p>
          </div>
        </div>
      </section>

      {/* Footer Padding for Mobile Sticky Bar */}
      <div className="h-24 md:h-0"></div>

      {/* Sticky Contact Bar for Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md shadow-[0_-10px_40px_rgba(0,0,0,0.15)] z-50 p-4 border-t border-gray-100/50 pb-safe">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Call for Admissions</p>
            <a href="tel:8307478182" className="text-lg font-heading font-black text-deepak-purple">
              +91 8307478182
            </a>
          </div>
          <a href="tel:8307478182" className="bg-deepak-red text-white p-4 rounded-full shadow-lg shadow-deepak-red/40 animate-pulse">
            <Phone size={24} />
          </a>
        </div>
      </div>
    </div>
  );
}
