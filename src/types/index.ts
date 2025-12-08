// TypeScript definitions for AnayaTaxi app

export interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

export interface MapMarker {
  lat: number;
  lng: number;
  title: string;
  type: 'current' | 'demo' | 'destination' | 'pickup' | 'dropoff';
}

export interface BookingFormData {
  passengerName: string;
  passengerEmail: string;
  passengerPhone: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupDate: string;
  pickupTime: string;
  passengers: number;
  carType: 'economy' | 'comfort' | 'premium' | 'suv';
  specialRequests?: string;
}

export interface FreeMapProps {
  center?: [number, number];
  zoom?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  markers?: MapMarker[];
  className?: string;
}

export interface EmailJSParams {
  passenger_name: string;
  passenger_email: string;
  passenger_phone: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_date: string;
  pickup_time: string;
  passengers: number;
  car_type: string;
  special_requests?: string;
  booking_id: string;
  to_email?: string;
}

export type LocationSettingType = 'pickup' | 'dropoff';
export type SubmitStatus = 'idle' | 'success' | 'error';