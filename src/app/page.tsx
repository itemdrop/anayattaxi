"use client";

import { useState } from 'react';
import { TaxiBookingApp } from '@/components/TaxiBookingApp';
import { IntroPage } from '@/components/IntroPage';

export default function Home() {
  const [currentPage, setCurrentPage] = useState<'intro' | 'booking'>('intro');

  const handleBookNow = () => {
    setCurrentPage('booking');
  };

  const handleBackToIntro = () => {
    setCurrentPage('intro');
  };

  if (currentPage === 'intro') {
    return <IntroPage onBookNow={handleBookNow} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500">
      {/* Back to Intro Button */}
      <div className="fixed top-4 left-4 z-50">
        <button
          onClick={handleBackToIntro}
          className="bg-black text-yellow-400 px-4 py-2 rounded-lg font-bold shadow-lg border-2 border-yellow-400 hover:bg-gray-800 transition-all"
        >
          ← Back to Home
        </button>
      </div>
      <TaxiBookingApp />
    </div>
  );
}
