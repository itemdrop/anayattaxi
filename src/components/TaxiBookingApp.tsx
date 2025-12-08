"use client";

import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import FreeMap from './FreeMap';
import '../styles/leaflet-fixes.css';
import { FreeLocationService } from '../utils/FreeLocationService';
import { useForm } from 'react-hook-form';
import { 
  LocationData, 
  MapMarker, 
  LocationSettingType, 
  SubmitStatus 
} from '../types';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  MapPin, 
  Navigation, 
  Phone, 
  Mail, 
  User, 
  Calendar, 
  Clock, 
  Users, 
  Car,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

// Form validation schema
const bookingSchema = z.object({
  passengerName: z.string().min(2, 'Name must be at least 2 characters'),
  passengerPhone: z.string().min(10, 'Please enter a valid phone number'),
  passengerEmail: z.string().email('Please enter a valid email address'),
  pickupAddress: z.string().min(5, 'Please enter a pickup address'),
  dropoffAddress: z.string().min(5, 'Please enter a drop-off address'),
  pickupDate: z.string().min(1, 'Please select a pickup date'),
  pickupTime: z.string().min(1, 'Please select a pickup time'),
  passengers: z.string(),
  carType: z.string(),
  specialRequests: z.string().optional(),
});

type BookingFormData = z.infer<typeof bookingSchema>;

export function TaxiBookingApp() {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [submitMessage, setSubmitMessage] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([37.7749, -122.4194]);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [nextLocationSetting, setNextLocationSetting] = useState<LocationSettingType>('pickup');

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
    reset
  } = useForm<BookingFormData>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      passengers: '1',
      carType: 'economy',
      pickupDate: new Date().toISOString().split('T')[0],
      pickupTime: new Date().toTimeString().slice(0, 5),
    }
  });

  // Map is now handled by the FreeMap component - no initialization needed!
  // Free OpenStreetMap with Leaflet - zero cost, no API keys required

  // Get user's current location with improved error handling
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser. Please enter your address manually.');
      return;
    }

    setLocationError('🔍 Getting your location...');
    
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 30000, // Longer timeout for better reliability
          maximumAge: 300000, // 5 minute cache for faster subsequent loads
        });
      });

      const { latitude, longitude } = position.coords;
      console.log('GPS coordinates obtained:', latitude, longitude);

      // Try multiple geocoding methods for better reliability
      let address = '';
      
      try {
        // Method 1: Try Google Maps Geocoding API if available
        const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (googleApiKey && googleApiKey !== 'your_google_maps_api_key_here') {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`
          );
          const data = await response.json();
          
          if (data.status === 'OK' && data.results && data.results.length > 0) {
            address = data.results[0].formatted_address;
          }
        }
        
        // Method 2: FREE OpenStreetMap reverse geocoding (no API key needed!)
        if (!address) {
          try {
            const osmResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'AnayaTaxi-App'
                }
              }
            );
            const osmData = await osmResponse.json();
            if (osmData && osmData.display_name) {
              address = osmData.display_name;
            }
          } catch (osmError) {
            console.warn('Free OSM geocoding failed:', osmError);
          }
        }
        
        // Method 3: Coordinate fallback
        if (!address) {
          address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }
        
      } catch (geocodeError) {
        console.warn('Geocoding failed, using coordinates:', geocodeError);
        address = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      const locationData: LocationData = {
        lat: latitude,
        lng: longitude,
        address,
      };

      setCurrentLocation(locationData);
      setLocationError('');
      console.log('Location data set:', locationData);

      // Update free map center and add marker
      setMapCenter([latitude, longitude]);
      setMapZoom(16);
      
      // Add marker to free map
      setMapMarkers([{
        lat: latitude,
        lng: longitude,
        title: 'Your Current Location',
        type: 'current'
      }]);
      
      console.log('Location set with address:', address);
      
    } catch (error: any) {
      console.error('Geolocation error:', error);
      let errorMessage = '❌ Unable to get your location. ';
      
      if (error.code) {
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage = '🚫 Location access denied. Please:\n• Click the location icon in your browser address bar\n• Allow location access and refresh the page\n• Or enter your address manually below';
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage = '📡 Location unavailable. Please check:\n• Your device\'s GPS is enabled\n• You have a good internet connection\n• Or enter your address manually';
            break;
          case 3: // TIMEOUT
            errorMessage = '⏱️ Location request timed out. Please try again or enter your address manually.';
            break;
          default:
            errorMessage += 'Please enter your address manually.';
            break;
        }
      } else {
        errorMessage += 'Please enter your pickup location manually.';
      }
      
      setLocationError(errorMessage);
    }
  };

  // Auto-get location on component mount - immediate for better UX
  useEffect(() => {
    // Get location immediately when component mounts
    if (typeof window !== 'undefined' && navigator.geolocation) {
      getCurrentLocation();
    }
  }, []);



  // Use current location for pickup
  const useCurrentLocationForPickup = () => {
    if (currentLocation) {
      setValue('pickupAddress', currentLocation.address);
    }
  };

  // Reset location selection order
  const resetLocationSelection = () => {
    setNextLocationSetting('pickup');
    // Remove pickup and dropoff markers
    setMapMarkers(prev => prev.filter(marker => 
      marker.type !== 'pickup' && marker.type !== 'dropoff'
    ));
    // Clear address fields
    setValue('pickupAddress', '');
    setValue('dropoffAddress', '');
  };

  // Handle map click to alternate between pickup and dropoff locations
  const handleMapClick = async (lat: number, lng: number) => {
    try {
      console.log(`Map clicked at: ${lat}, ${lng} - Setting ${nextLocationSetting}`);
      
      const isSettingPickup = nextLocationSetting === 'pickup';
      const fieldName = isSettingPickup ? 'pickupAddress' : 'dropoffAddress';
      const markerTitle = isSettingPickup ? 'Pickup Location' : 'Dropoff Location';
      const markerType = nextLocationSetting;
      
      // Show loading state
      setValue(fieldName, '🔍 Getting address...');
      
      // Get address from coordinates using free geocoding
      const address = await FreeLocationService.getAddressFromCoords(lat, lng);
      
      // Update the address field
      setValue(fieldName, address);
      
      // Add marker to map - keep current location, replace pickup/dropoff as needed
      const newMarker = {
        lat,
        lng,
        title: markerTitle,
        type: markerType as 'pickup' | 'dropoff'
      };
      
      // Update markers - keep current location, replace the specific type being set
      setMapMarkers(prev => [
        ...prev.filter(marker => marker.type !== markerType && marker.type !== 'demo'),
        newMarker
      ]);
      
      // Always switch to next location type after setting one
      if (isSettingPickup) {
        setNextLocationSetting('dropoff');
      } else {
        // After dropoff is set, cycle back to pickup for next booking
        setNextLocationSetting('pickup');
      }
      
      console.log(`${isSettingPickup ? 'Pickup' : 'Dropoff'} address set:`, address);
    } catch (error) {
      console.error('Failed to get address from map click:', error);
      const fieldName = nextLocationSetting === 'pickup' ? 'pickupAddress' : 'dropoffAddress';
      setValue(fieldName, `${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      
      // Still switch to next location even if geocoding fails
      setNextLocationSetting(nextLocationSetting === 'pickup' ? 'dropoff' : 'pickup');
    }
  };

  // Set demo location
  const setDemoLocation = () => {
    const demoLocation: LocationData = {
      lat: 37.7749,
      lng: -122.4194,
      address: "San Francisco, CA, USA (Demo Location)"
    };
    setCurrentLocation(demoLocation);
    setLocationError('');
    
    // Update free map with demo location
    setMapCenter([demoLocation.lat, demoLocation.lng]);
    setMapZoom(15);
    
    // Add demo marker to free map
    setMapMarkers([{
      lat: demoLocation.lat,
      lng: demoLocation.lng,
      title: 'Demo Location - San Francisco',
      type: 'demo'
    }]);
    
    console.log('Demo location set:', demoLocation.address);
  };

  // Handle form submission
  const onSubmit = async (data: BookingFormData) => {
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Initialize EmailJS (you'll need to set up these in EmailJS dashboard)
      emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_USER_ID || 'YOUR_EMAILJS_USER_ID');

      const templateParams = {
        to_email: data.passengerEmail,
        passenger_name: data.passengerName,
        passenger_phone: data.passengerPhone,
        passenger_email: data.passengerEmail,
        pickup_address: data.pickupAddress,
        dropoff_address: data.dropoffAddress,
        pickup_date: data.pickupDate,
        pickup_time: data.pickupTime,
        passengers: data.passengers,
        car_type: data.carType,
        special_requests: data.specialRequests || 'None',
        booking_id: `TX-${Date.now()}`,
        booking_date: new Date().toLocaleString(),
        current_location: currentLocation?.address || 'Not available',
      };

      // Send email to customer
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
        process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || 'YOUR_TEMPLATE_ID',
        templateParams
      );

      // Send email to taxi company (optional)
      await emailjs.send(
        process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || 'YOUR_SERVICE_ID',
        process.env.NEXT_PUBLIC_EMAILJS_ADMIN_TEMPLATE_ID || 'YOUR_ADMIN_TEMPLATE_ID',
        {
          ...templateParams,
          to_email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@anayataxi.com',
        }
      );

      setSubmitStatus('success');
      setSubmitMessage(`Booking confirmed! Confirmation details sent to ${data.passengerEmail}`);
      reset();
      
    } catch (error) {
      console.error('Error sending booking:', error);
      setSubmitStatus('error');
      setSubmitMessage('Failed to send booking. Please try again or call us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <header className="text-center mb-8">
        <h1 className="text-6xl font-bold text-black bg-yellow-400 rounded-2xl px-8 py-4 inline-block shadow-2xl border-4 border-black">
          🚕 AnayaTaxi
        </h1>
      </header>

      {/* Main Content */}
      <main className="bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-black">
        <div className="grid lg:grid-cols-2 min-h-[700px]">
          {/* Map Section */}
          <div className="bg-yellow-50 p-8 border-r-4 border-black">
            {/* Free Map Container - No API keys needed! */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-black mb-4 flex items-center">
                <MapPin className="w-6 h-6 mr-2 text-yellow-600" />
                🗺️ Interactive Taxi Map
              </h2>
              <FreeMap 
                center={mapCenter}
                zoom={mapZoom}
                markers={mapMarkers}
                className="w-full h-80 rounded-2xl border-4 border-yellow-400 shadow-xl"
                onLocationSelect={handleMapClick}
              />
              <div className="text-sm text-black mt-4 text-center bg-yellow-100 p-4 rounded-xl border-2 border-yellow-400">
                <p className="mb-3 font-semibold text-lg">
                  🚕 <strong>Professional Tip:</strong> Click on the map to set locations in order
                </p>
                <div className="flex items-center justify-center gap-3 mb-3">
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                    nextLocationSetting === 'pickup' 
                      ? 'bg-yellow-400 text-black border-2 border-black animate-pulse' 
                      : 'bg-green-400 text-black border-2 border-green-600'
                  }`}>
                    {nextLocationSetting === 'pickup' ? '👆 NEXT:' : '✅'} 🚗 PICKUP
                  </span>
                  <span className={`px-4 py-2 rounded-full text-sm font-bold shadow-lg ${
                    nextLocationSetting === 'dropoff' 
                      ? 'bg-yellow-400 text-black border-2 border-black animate-pulse' 
                      : 'bg-green-400 text-black border-2 border-green-600'
                  }`}>
                    {nextLocationSetting === 'dropoff' ? '👆 NEXT:' : '✅'} 🎯 DROPOFF
                  </span>
                </div>
                <button
                  type="button"
                  onClick={resetLocationSelection}
                  className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-full transition-colors"
                >
                  🔄 Reset Map Selection
                </button>
              </div>
            </div>

            {/* Location Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Current Location</h3>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                  🆓 FREE GPS
                </span>
              </div>
              
              {locationError ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2 text-red-800">
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-2">Location Access Issue</p>
                      <div className="text-xs leading-relaxed whitespace-pre-line">
                        {locationError}
                      </div>
                    </div>
                  </div>
                </div>
              ) : currentLocation ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start gap-2 text-green-800">
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium mb-1">Location Found</p>
                      <p className="text-xs leading-relaxed">{currentLocation.address}</p>
                      <p className="text-xs text-green-600 mt-1">
                        Accuracy: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-black bg-yellow-200 p-3 rounded-lg border border-yellow-400">
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-600" />
                    <p className="text-sm font-semibold">🚕 Detecting your location...</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={getCurrentLocation}
                  className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg text-sm font-bold transition-all border-2 border-black shadow-lg hover:shadow-xl"
                >
                  <Navigation className="h-4 w-4" />
                  📍 {currentLocation ? 'Refresh Location' : 'Get My Location'}
                </button>
                
                <button
                  onClick={resetLocationSelection}
                  className="flex items-center gap-2 bg-black hover:bg-gray-800 text-yellow-400 px-6 py-3 rounded-lg text-sm font-bold transition-all border-2 border-yellow-400 shadow-lg hover:shadow-xl"
                >
                  🔄 Reset Locations
                </button>
              </div>
              
              {!currentLocation && !locationError && (
                <div className="mt-4 p-4 bg-gradient-to-r from-yellow-100 to-amber-100 border-2 border-yellow-400 rounded-lg shadow-lg">
                  <p className="text-sm text-black font-semibold">
                    🚕 <strong>Professional Tip:</strong> Enable location services for automatic address detection, 
                    or you can enter your pickup address manually in the booking form.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Booking Form */}
          <div className="p-8 bg-gradient-to-b from-yellow-50 to-white">
            <h2 className="text-3xl font-bold text-black mb-6 text-center bg-yellow-400 py-3 px-6 rounded-xl border-2 border-black shadow-lg">
              🚕 Book Your Professional Taxi
            </h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-black font-bold mb-3">
                    <User className="h-5 w-5 text-yellow-600" />
                    🗃️ Full Name *
                  </label>
                  <input
                    {...register('passengerName')}
                    className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                    placeholder="🗃️ Enter your full name"
                  />
                  {errors.passengerName && (
                    <p className="text-red-500 text-sm mt-1">{errors.passengerName.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-black font-bold mb-3">
                    <Phone className="h-5 w-5 text-yellow-600" />
                    📞 Phone Number *
                  </label>
                  <input
                    {...register('passengerPhone')}
                    type="tel"
                    className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                    placeholder="📞 Enter your phone number"
                  />
                  {errors.passengerPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.passengerPhone.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-black font-bold mb-3">
                  <Mail className="h-5 w-5 text-yellow-600" />
                  📧 Email Address *
                </label>
                <input
                  {...register('passengerEmail')}
                  type="email"
                  className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                  placeholder="📧 Enter your email address"
                />
                {errors.passengerEmail && (
                  <p className="text-red-500 text-sm mt-1">{errors.passengerEmail.message}</p>
                )}
              </div>

              {/* Location Information */}
              <div>
                <label className="flex items-center gap-2 text-black font-bold mb-3 text-lg">
                  <MapPin className="h-5 w-5 text-yellow-600" />
                  🚗 Pickup Location * 
                  <span className={`text-sm px-3 py-1 rounded-full font-bold border-2 ${
                    nextLocationSetting === 'pickup'
                      ? 'bg-yellow-400 text-black border-black animate-pulse shadow-lg'
                      : 'bg-green-400 text-black border-green-600'
                  }`}>
                    🗺️ {nextLocationSetting === 'pickup' ? 'CLICK MAP TO SELECT' : 'SET VIA MAP'}
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    {...register('pickupAddress')}
                    className="flex-1 p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                    placeholder="📍 Enter address, use GPS, or click map first"
                  />
                  <button
                    type="button"
                    onClick={useCurrentLocationForPickup}
                    disabled={!currentLocation}
                    className={`px-4 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap border-2 shadow-lg ${
                      currentLocation 
                        ? 'bg-yellow-400 hover:bg-yellow-500 text-black border-black hover:shadow-xl' 
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed border-gray-400'
                    }`}
                    title={currentLocation ? 'Use your current location' : 'Get your location first'}
                  >
                    {currentLocation ? 'Use Current' : 'No Location'}
                  </button>
                </div>
                {errors.pickupAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.pickupAddress.message}</p>
                )}
                {currentLocation && (
                  <p className="text-green-600 text-xs mt-1 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Current location available: {currentLocation.address.slice(0, 50)}...
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center gap-2 text-black font-bold mb-3 text-lg">
                  <Navigation className="h-5 w-5 text-yellow-600" />
                  🎯 Drop-off Location *
                  <span className={`text-sm px-3 py-1 rounded-full font-bold border-2 ${
                    nextLocationSetting === 'dropoff'
                      ? 'bg-yellow-400 text-black border-black animate-pulse shadow-lg'
                      : 'bg-green-400 text-black border-green-600'
                  }`}>
                    🗺️ {nextLocationSetting === 'dropoff' ? 'CLICK MAP TO SELECT' : 'CLICK MAP AFTER PICKUP'}
                  </span>
                </label>
                <input
                  {...register('dropoffAddress')}
                  className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                  placeholder="🎯 Enter destination or click on map after pickup"
                />
                {errors.dropoffAddress && (
                  <p className="text-red-500 text-sm mt-1">{errors.dropoffAddress.message}</p>
                )}
              </div>

              {/* Date and Time */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-black font-bold mb-3">
                    <Calendar className="h-5 w-5 text-yellow-600" />
                    📅 Pickup Date *
                  </label>
                  <input
                    {...register('pickupDate')}
                    type="date"
                    className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                  />
                  {errors.pickupDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.pickupDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-black font-bold mb-3">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    🕰️ Pickup Time *
                  </label>
                  <input
                    {...register('pickupTime')}
                    type="time"
                    className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                  />
                  {errors.pickupTime && (
                    <p className="text-red-500 text-sm mt-1">{errors.pickupTime.message}</p>
                  )}
                </div>
              </div>

              {/* Ride Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-black font-bold mb-3">
                    <Users className="h-5 w-5 text-yellow-600" />
                    👥 Passengers
                  </label>
                  <select
                    {...register('passengers')}
                    className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                  >
                    <option value="1">🚶 1 Passenger</option>
                    <option value="2">🚶‍♀️🚶 2 Passengers</option>
                    <option value="3">🚶‍♀️🚶🚶‍♂️ 3 Passengers</option>
                    <option value="4">👨‍👩‍👦‍👦 4 Passengers</option>
                    <option value="5">👥 5+ Passengers</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-black font-bold mb-3">
                    <Car className="h-5 w-5 text-yellow-600" />
                    🚗 Car Type
                  </label>
                  <select
                    {...register('carType')}
                    className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                  >
                    <option value="economy">🚕 Economy Taxi</option>
                    <option value="comfort">🚖 Comfort Taxi</option>
                    <option value="premium">🚘 Premium Taxi</option>
                    <option value="suv">🚙 SUV Taxi</option>
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="flex items-center gap-2 text-black font-bold mb-3">
                  <MessageSquare className="h-5 w-5 text-yellow-600" />
                  💬 Special Requests
                </label>
                <textarea
                  {...register('specialRequests')}
                  className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all resize-none bg-yellow-50 font-semibold text-black shadow-inner"
                  rows={4}
                  placeholder="💬 Any special requirements, accessibility needs, or notes for your taxi ride..."
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 hover:from-yellow-500 hover:via-yellow-600 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold py-6 px-8 rounded-xl text-xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl flex items-center justify-center gap-3 border-4 border-black shadow-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-6 w-6 animate-spin" />
                    🚕 BOOKING YOUR TAXI...
                  </>
                ) : (
                  <>
                    <Car className="h-6 w-6" />
                    🚖 BOOK PROFESSIONAL TAXI NOW
                  </>
                )}
              </button>
            </form>

            {/* Status Message */}
            {submitStatus !== 'idle' && (
              <div className={`mt-6 p-6 rounded-xl flex items-center gap-4 border-2 shadow-xl ${
                submitStatus === 'success' 
                  ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-900 border-green-400' 
                  : 'bg-gradient-to-r from-red-100 to-red-200 text-red-900 border-red-400'
              }`}>
                {submitStatus === 'success' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <AlertCircle className="h-6 w-6" />
                )}
                <p className="font-bold text-lg">{submitMessage}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center mt-8">
        <div className="bg-black rounded-2xl px-6 py-4 inline-block shadow-2xl border-2 border-yellow-400">
          <p className="text-yellow-400 font-bold">🚕 &copy; 2025 AnayaTaxi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}