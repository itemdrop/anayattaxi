"use client";

import React, { useState, useEffect, useRef } from 'react';
import emailjs from '@emailjs/browser';
import FreeMap from './FreeMap';
import '../styles/leaflet-fixes.css';
import { FreeLocationService } from '../utils/FreeLocationService';
import { MalmoStreetService } from '../services/MalmoStreetService';
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
  const [mapCenter, setMapCenter] = useState<[number, number]>([55.6050, 13.0038]);
  const [mapZoom, setMapZoom] = useState(13);
  const [mapMarkers, setMapMarkers] = useState<MapMarker[]>([]);
  const [nextLocationSetting, setNextLocationSetting] = useState<LocationSettingType>('pickup');
  const [isGeocodingLocation, setIsGeocodingLocation] = useState(false);
  const [streetSuggestions, setStreetSuggestions] = useState<Array<{display_name: string; lat: number; lon: number; address: string}>>([]);
  const [showSuggestions, setShowSuggestions] = useState<{pickup: boolean; dropoff: boolean}>({pickup: false, dropoff: false});
  const [searchingStreets, setSearchingStreets] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
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
      console.log('🌍 Requesting GPS location with high accuracy...');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.log('⏰ GPS timeout - trying with lower accuracy');
          // Try again with lower accuracy if high accuracy fails
          navigator.geolocation.getCurrentPosition(
            resolve,
            reject,
            {
              enableHighAccuracy: false,
              timeout: 10000,
              maximumAge: 60000
            }
          );
        }, 15000);
        
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            clearTimeout(timeoutId);
            resolve(pos);
          },
          (err) => {
            clearTimeout(timeoutId);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
          }
        );
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
        
        // Method 2: Use our CORS-free geocoding API
        if (!address) {
          try {
            console.log('🌍 Using internal geocoding API for current location...');
            address = await FreeLocationService.getAddressFromCoords(latitude, longitude);
            console.log('✅ Internal geocoding successful:', address);
          } catch (geocodeError) {
            console.warn('⚠️ Internal geocoding failed:', geocodeError);
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
      console.log('✅ Location data set:', locationData);

      // Update free map center and add marker - make this more prominent
      setMapCenter([latitude, longitude]);
      setMapZoom(17); // Closer zoom for better accuracy
      
      // Add marker to free map - replace any existing markers
      const currentLocationMarker = {
        lat: latitude,
        lng: longitude,
        title: '📍 Your Exact Location',
        type: 'current' as const
      };
      
      setMapMarkers([currentLocationMarker]);
      console.log('🗺️ Map centered on user location with marker:', address);
      
      // Auto-fill pickup address with user's location
      setValue('pickupAddress', address, { shouldValidate: true });
      console.log('📋 Auto-filled pickup address from current location');
      
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

  // Auto-get location on component mount with improved detection
  useEffect(() => {
    let isComponentMounted = true;
    
    const initializeLocation = async () => {
      if (typeof window !== 'undefined' && navigator.geolocation) {
        console.log('🚕 Component mounted, getting user location...');
        
        // Check if location permission is already granted
        if ('permissions' in navigator) {
          try {
            const permission = await navigator.permissions.query({ name: 'geolocation' });
            console.log('📍 Geolocation permission status:', permission.state);
            
            if (permission.state === 'granted' && isComponentMounted) {
              getCurrentLocation();
            } else if (permission.state === 'prompt' && isComponentMounted) {
              // Prompt user for location
              getCurrentLocation();
            } else {
              console.log('⚠️ Location permission denied, using default center');
              if (isComponentMounted) {
                setMapCenter([55.6050, 13.0038]); // Malmö, Sweden default
                setMapZoom(13);
              }
            }
          } catch (permError) {
            console.log('📍 Permission API not available, trying direct location access');
            if (isComponentMounted) {
              getCurrentLocation();
            }
          }
        } else {
          // Fallback for browsers without permissions API
          if (isComponentMounted) {
            getCurrentLocation();
          }
        }
      } else {
        console.log('❌ Geolocation not available');
        if (isComponentMounted) {
          setMapCenter([55.6050, 13.0038]); // Malmö, Sweden default
          setMapZoom(13);
        }
      }
    };
    
    initializeLocation();
    
    return () => {
      isComponentMounted = false;
    };
  }, []);

  // Auto-center map when current location is detected
  useEffect(() => {
    if (currentLocation) {
      console.log('🗺️ Auto-centering map on user location:', currentLocation.address);
      setMapCenter([currentLocation.lat, currentLocation.lng]);
      setMapZoom(15); // Closer zoom for user location
      
      // Auto-fill pickup address if it's empty
      const currentPickupAddress = getValues('pickupAddress');
      if (!currentPickupAddress || currentPickupAddress.trim() === '') {
        console.log('📍 Auto-filling pickup address with current location');
        setValue('pickupAddress', currentLocation.address);
      }
    }
  }, [currentLocation, setValue, getValues]);

  // Aggressively request location on mount
  useEffect(() => {
    let mounted = true;
    
    const requestLocationOnMount = async () => {
      // Wait a bit for page to fully load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (mounted && !currentLocation && navigator.geolocation) {
        console.log('🚕 Auto-requesting location on page load...');
        try {
          await getCurrentLocation();
        } catch (error) {
          console.log('⚠️ Auto location request failed, user can click button');
        }
      }
    };
    
    requestLocationOnMount();
    
    return () => {
      mounted = false;
    };
  }, []);

  // Hide suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowSuggestions({pickup: false, dropoff: false});
      setStreetSuggestions([]);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Use current location for pickup
  const useCurrentLocationForPickup = () => {
    if (currentLocation) {
      setValue('pickupAddress', currentLocation.address);
    }
  };

  // Search for street suggestions in Malmö
  const searchStreets = async (query: string, field: 'pickup' | 'dropoff') => {
    if (!query || query.length < 2) {
      setStreetSuggestions([]);
      setShowSuggestions(prev => ({...prev, [field]: false}));
      return;
    }

    try {
      setSearchingStreets(true);
      const suggestions = await MalmoStreetService.searchStreets(query);
      setStreetSuggestions(suggestions);
      setShowSuggestions(prev => ({...prev, [field]: suggestions.length > 0}));
    } catch (error) {
      console.error('Street search failed:', error);
      setStreetSuggestions([]);
      setShowSuggestions(prev => ({...prev, [field]: false}));
    } finally {
      setSearchingStreets(false);
    }
  };

  // Handle suggestion selection
  const selectStreetSuggestion = (suggestion: any, field: 'pickup' | 'dropoff') => {
    const address = MalmoStreetService.formatMalmoAddress(suggestion.address);
    setValue(field === 'pickup' ? 'pickupAddress' : 'dropoffAddress', address);
    
    // Add marker to map
    const markerTitle = field === 'pickup' ? '🚕 Pickup Location' : '🏁 Dropoff Location';
    const newMarker = {
      lat: suggestion.lat,
      lng: suggestion.lon,
      title: markerTitle,
      type: field
    };
    
    setMapMarkers(prev => {
      const filtered = prev.filter(marker => marker.type !== field && marker.type !== 'demo');
      return [...filtered, newMarker];
    });
    
    // Center map on selected location
    setMapCenter([suggestion.lat, suggestion.lon]);
    setMapZoom(16);
    
    // Hide suggestions
    setShowSuggestions(prev => ({...prev, [field]: false}));
    setStreetSuggestions([]);
  };

  // Debounce street search
  const handleAddressChange = (value: string, field: 'pickup' | 'dropoff') => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    
    debounceTimeout.current = setTimeout(() => {
      searchStreets(value, field);
    }, 300);
  };

  // Reset location selection order
  const resetLocationSelection = () => {
    console.log('🔄 Resetting location selection');
    setNextLocationSetting('pickup');
    // Remove pickup and dropoff markers, keep current location
    setMapMarkers(prev => {
      const filtered = prev.filter(marker => 
        marker.type !== 'pickup' && marker.type !== 'dropoff' && marker.type !== 'demo'
      );
      console.log('🗺️ Reset markers, keeping:', filtered.map(m => m.type));
      return filtered;
    });
    // Clear address fields
    setValue('pickupAddress', '', { shouldValidate: true });
    setValue('dropoffAddress', '', { shouldValidate: true });
    console.log('✅ Location selection reset complete');
  };

  // Handle map click to alternate between pickup and dropoff locations
  const handleMapClick = async (lat: number, lng: number) => {
    try {
      console.log(`🗺️ Map clicked at: ${lat}, ${lng}`);
      console.log(`🎯 Current nextLocationSetting: ${nextLocationSetting}`);
      
      // Prevent double-clicks and ensure state is ready
      setIsGeocodingLocation(true);
      
      // Force ensure we have the correct state
      const currentSetting = nextLocationSetting;
      const isSettingPickup = currentSetting === 'pickup';
      const fieldName = isSettingPickup ? 'pickupAddress' : 'dropoffAddress';
      const markerTitle = isSettingPickup ? '🚕 Pickup Location' : '🏁 Dropoff Location';
      const markerType = currentSetting;
      
      console.log(`📝 Setting field: ${fieldName} (isPickup: ${isSettingPickup})`);
      console.log(`📍 Marker type: ${markerType}`);
      
      // Show loading state immediately with better UX
      setIsGeocodingLocation(true);
      setValue(fieldName, '🔍 Getting address...', { shouldValidate: true });
      
      // Get address from coordinates using our improved geocoding service
      let address: string;
      try {
        console.log(`🌍 Calling geocoding service for ${markerType}...`);
        address = await FreeLocationService.getAddressFromCoords(lat, lng);
        console.log(`✅ Address resolved for ${markerType}: ${address}`);
        
        // Provide user feedback for successful geocoding
        if (address && !address.startsWith('📍')) {
          console.log(`🎯 Successfully geocoded ${markerType} location`);
        }
      } catch (geocodingError) {
        console.error(`❌ Geocoding failed for ${markerType}:`, geocodingError);
        address = `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        
        // Show user-friendly error in development
        if (process.env.NODE_ENV === 'development') {
          console.warn(`⚠️ Using coordinates as fallback for ${markerType}`);
        }
      } finally {
        setIsGeocodingLocation(false);
      }
      
      // Update the address field with validation
      setValue(fieldName, address, { shouldValidate: true, shouldDirty: true });
      console.log(`📋 Form field '${fieldName}' updated with: ${address}`);
      
      // Create new marker
      const newMarker = {
        lat,
        lng,
        title: markerTitle,
        type: markerType as 'pickup' | 'dropoff'
      };
      
      // Update markers - keep current location, replace the specific type being set
      setMapMarkers(prev => {
        // Keep current location and other types, replace only the current setting type
        const filteredMarkers = prev.filter(marker => 
          marker.type !== markerType && marker.type !== 'demo'
        );
        console.log(`🗺️ Adding marker of type '${markerType}' to map`);
        console.log(`📍 Previous markers:`, prev.map(m => m.type));
        console.log(`📍 New marker list will have:`, [...filteredMarkers, newMarker].map(m => m.type));
        return [...filteredMarkers, newMarker];
      });
      
      // Switch to next location type immediately for better UX
      const newNextSetting = isSettingPickup ? 'dropoff' : 'pickup';
      console.log(`🔄 Switching from '${currentSetting}' to '${newNextSetting}'`);
      
      // Update state immediately with better feedback
      setNextLocationSetting(newNextSetting);
      console.log(`✅ State switched successfully to: ${newNextSetting}`);
      
      // Show user feedback for successful click
      if (isSettingPickup) {
        console.log('🚕 Pickup location set! Now click for dropoff.');
      } else {
        console.log('🏁 Dropoff location set! Ready to book.');
      }
      
    } catch (error) {
      console.error('❌ Map click handler failed:', error);
      const fieldName = nextLocationSetting === 'pickup' ? 'pickupAddress' : 'dropoffAddress';
      setValue(fieldName, `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      
      // Still switch to next location even if everything fails
      const newNextSetting = nextLocationSetting === 'pickup' ? 'dropoff' : 'pickup';
      setNextLocationSetting(newNextSetting);
      console.log(`🔄 Error recovery: switched to ${newNextSetting}`);
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
              
              {isGeocodingLocation ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-blue-800">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <div>
                      <p className="text-sm font-medium">🔍 Getting address from map location...</p>
                      <p className="text-xs text-blue-600 mt-1">Please wait while we convert coordinates to address</p>
                    </div>
                  </div>
                </div>
              ) : locationError ? (
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
                    {nextLocationSetting === 'pickup' 
                      ? '👆 STEP 1: CLICK MAP FOR PICKUP' 
                      : '✅ PICKUP SET - USE GPS OR TYPE BELOW'}
                  </span>
                </label>
                <div className="flex gap-2 relative">
                  <div className="flex-1 relative">
                    <input
                      {...register('pickupAddress')}
                      className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                      placeholder="📍 Start typing Malmö street name..."
                      onChange={(e) => {
                        register('pickupAddress').onChange(e);
                        handleAddressChange(e.target.value, 'pickup');
                      }}
                      onFocus={() => {
                        const value = getValues('pickupAddress');
                        if (value && value.length >= 2) {
                          searchStreets(value, 'pickup');
                        }
                      }}
                    />
                    {showSuggestions.pickup && streetSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full bg-white border-2 border-yellow-400 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
                        {streetSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="p-3 hover:bg-yellow-100 cursor-pointer border-b border-yellow-200 text-sm"
                            onClick={() => selectStreetSuggestion(suggestion, 'pickup')}
                          >
                            <div className="font-semibold text-black">📍 {suggestion.address}</div>
                            <div className="text-gray-600 text-xs">{suggestion.display_name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
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
                      : 'bg-gray-300 text-gray-600 border-gray-400'
                  }`}>
                    {nextLocationSetting === 'dropoff' 
                      ? '👆 STEP 2: CLICK MAP FOR DROPOFF' 
                      : '⏳ WAITING FOR PICKUP FIRST'}
                  </span>
                </label>
                <div className="relative">
                  <input
                    {...register('dropoffAddress')}
                    className="w-full p-4 border-2 border-yellow-400 rounded-lg focus:border-black focus:outline-none transition-all bg-yellow-50 font-semibold text-black shadow-inner"
                    placeholder="🎯 Start typing Malmö destination..."
                    onChange={(e) => {
                      register('dropoffAddress').onChange(e);
                      handleAddressChange(e.target.value, 'dropoff');
                    }}
                    onFocus={() => {
                      const value = getValues('dropoffAddress');
                      if (value && value.length >= 2) {
                        searchStreets(value, 'dropoff');
                      }
                    }}
                  />
                  {showSuggestions.dropoff && streetSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border-2 border-yellow-400 rounded-lg mt-1 shadow-xl max-h-60 overflow-y-auto">
                      {streetSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-3 hover:bg-yellow-100 cursor-pointer border-b border-yellow-200 text-sm"
                          onClick={() => selectStreetSuggestion(suggestion, 'dropoff')}
                        >
                          <div className="font-semibold text-black">🎯 {suggestion.address}</div>
                          <div className="text-gray-600 text-xs">{suggestion.display_name}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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