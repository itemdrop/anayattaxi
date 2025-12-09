"use client";

import React from 'react';
import { 
  Car, 
  MapPin, 
  Clock, 
  Shield, 
  Star, 
  Phone,
  Mail,
  Navigation,
  CheckCircle
} from 'lucide-react';

interface IntroPageProps {
  onBookNow: () => void;
}

export function IntroPage({ onBookNow }: IntroPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-yellow-500 to-amber-500">
      {/* Header */}
      <header className="text-center py-12">
        <h1 className="text-7xl font-bold text-black bg-white rounded-2xl px-12 py-6 inline-block shadow-2xl border-4 border-black mb-6">
          🚕 AnayaTaxi
        </h1>
        <p className="text-2xl text-black font-bold bg-yellow-300 rounded-full px-8 py-3 inline-block shadow-lg border-2 border-black">
          Professional Taxi Service - Reliable & Fast
        </p>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-3xl shadow-2xl border-4 border-black p-8 mb-8">
          {/* Company Info */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-black mb-6 flex items-center justify-center">
              <MapPin className="w-10 h-10 mr-4 text-yellow-600" />
              🏢 About AnayaTaxi
            </h2>
            <div className="bg-yellow-100 rounded-2xl p-8 border-2 border-yellow-400 shadow-lg">
              <p className="text-xl text-black mb-4 font-semibold">
                Welcome to AnayaTaxi, your trusted transportation partner serving the greater metropolitan area.
              </p>
              <p className="text-lg text-gray-800 mb-6">
                Based in the heart of the city, we provide professional, reliable, and safe taxi services 24/7. 
                Our modern fleet and experienced drivers ensure you reach your destination comfortably and on time.
              </p>
              <div className="grid md:grid-cols-2 gap-6 text-left">
                <div className="bg-white p-4 rounded-xl border-2 border-yellow-400 shadow-md">
                  <h3 className="font-bold text-lg text-black mb-2 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-yellow-600" />
                    📍 Service Area
                  </h3>
                  <p className="text-gray-700">Greater Metropolitan Area & Surrounding Cities</p>
                </div>
                <div className="bg-white p-4 rounded-xl border-2 border-yellow-400 shadow-md">
                  <h3 className="font-bold text-lg text-black mb-2 flex items-center">
                    <Clock className="w-5 h-5 mr-2 text-yellow-600" />
                    ⏰ Operating Hours
                  </h3>
                  <p className="text-gray-700">24/7 Service Available</p>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center bg-gradient-to-b from-yellow-100 to-yellow-200 p-6 rounded-2xl border-2 border-yellow-400 shadow-lg">
              <div className="bg-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                <Navigation className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">🗺️ GPS Tracking</h3>
              <p className="text-gray-800">Real-time location tracking with free OpenStreetMap integration for accurate navigation.</p>
            </div>

            <div className="text-center bg-gradient-to-b from-yellow-100 to-yellow-200 p-6 rounded-2xl border-2 border-yellow-400 shadow-lg">
              <div className="bg-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                <Shield className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">🛡️ Safe & Secure</h3>
              <p className="text-gray-800">Licensed professional drivers with background checks and insurance coverage.</p>
            </div>

            <div className="text-center bg-gradient-to-b from-yellow-100 to-yellow-200 p-6 rounded-2xl border-2 border-yellow-400 shadow-lg">
              <div className="bg-yellow-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-black">
                <Clock className="w-8 h-8 text-black" />
              </div>
              <h3 className="text-xl font-bold text-black mb-3">⚡ Fast Service</h3>
              <p className="text-gray-800">Quick response times with average pickup within 10-15 minutes of booking.</p>
            </div>
          </div>

          {/* Services */}
          <div className="bg-gradient-to-r from-yellow-100 to-amber-100 rounded-2xl p-8 border-2 border-yellow-400 shadow-lg mb-8">
            <h3 className="text-3xl font-bold text-black text-center mb-6 flex items-center justify-center">
              <Car className="w-8 h-8 mr-3 text-yellow-600" />
              🚖 Our Services
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: "🚕", name: "Economy Taxi", desc: "Affordable rides" },
                { icon: "🚖", name: "Comfort Taxi", desc: "Enhanced comfort" },
                { icon: "🚗", name: "Premium Taxi", desc: "Luxury experience" },
                { icon: "🚙", name: "SUV Taxi", desc: "Group transport" }
              ].map((service, index) => (
                <div key={index} className="bg-white p-4 rounded-xl border border-yellow-400 shadow-md text-center">
                  <div className="text-3xl mb-2">{service.icon}</div>
                  <h4 className="font-bold text-black">{service.name}</h4>
                  <p className="text-sm text-gray-600">{service.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Why Choose Us */}
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-black mb-6 flex items-center justify-center">
              <Star className="w-8 h-8 mr-3 text-yellow-600" />
              ⭐ Why Choose AnayaTaxi?
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "✅ Professional licensed drivers",
                "✅ Modern, clean vehicles", 
                "✅ Competitive pricing",
                "✅ 24/7 customer support",
                "✅ Easy online booking",
                "✅ Real-time tracking"
              ].map((feature, index) => (
                <div key={index} className="bg-green-100 p-3 rounded-lg border border-green-400 shadow-sm">
                  <p className="text-black font-semibold">{feature}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-black rounded-2xl p-6 text-center mb-8">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">📞 Contact Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center justify-center text-yellow-400">
                <Phone className="w-5 h-5 mr-2" />
                <span className="font-semibold">📱 Call: (555) 123-TAXI</span>
              </div>
              <div className="flex items-center justify-center text-yellow-400">
                <Mail className="w-5 h-5 mr-2" />
                <span className="font-semibold">📧 info@anayataxi.com</span>
              </div>
            </div>
          </div>

          {/* Book Now Button */}
          <div className="text-center">
            <button
              onClick={onBookNow}
              className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-amber-600 text-black font-bold py-6 px-16 rounded-2xl text-2xl transition-all duration-300 transform hover:scale-105 shadow-2xl border-4 border-black hover:shadow-3xl"
            >
              🚕 BOOK YOUR TAXI NOW
            </button>
            <p className="text-lg text-gray-700 mt-4 font-semibold">
              Quick & Easy Online Booking - Get Your Ride in Minutes!
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="text-center">
          <div className="bg-black rounded-2xl px-6 py-4 inline-block shadow-2xl border-2 border-yellow-400">
            <p className="text-yellow-400 font-bold">🚕 © 2025 AnayaTaxi - Your Reliable Transportation Partner</p>
          </div>
        </footer>
      </div>
    </div>
  );
}