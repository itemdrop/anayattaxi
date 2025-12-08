"use client";

import { useEffect, useRef, useState } from 'react';
import { FreeMapProps } from '../types';

const FreeMap: React.FC<FreeMapProps> = ({
  center = [40.7128, -74.0060], // Default to NYC
  zoom = 13,
  onLocationSelect,
  markers = [],
  className = "w-full h-[400px] rounded-lg overflow-hidden border border-gray-200"
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Only run on client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Initialize map only on client side
  useEffect(() => {
    if (!isClient || !mapRef.current || mapInstanceRef.current) return;

    // Dynamically import Leaflet only on client
    const initializeMap = async () => {
      const L = (await import('leaflet')).default;
      // CSS is already imported in _app or layout

      // Fix Leaflet's default markers
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      });

      // Create map instance
      const map = L.map(mapRef.current!).setView(center, zoom);

      // Add OpenStreetMap tiles (completely free!)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      // Add click handler for location selection
      if (onLocationSelect) {
        map.on('click', (e: any) => {
          onLocationSelect(e.latlng.lat, e.latlng.lng);
        });
      }

      mapInstanceRef.current = { map, L };
    };

    initializeMap().catch(console.error);

    return () => {
      if (mapInstanceRef.current?.map) {
        mapInstanceRef.current.map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isClient]);

  // Update map center and zoom
  useEffect(() => {
    if (mapInstanceRef.current?.map && center && isClient) {
      mapInstanceRef.current.map.setView(center, zoom);
    }
  }, [center, zoom, isClient]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current?.map || !mapInstanceRef.current?.L || !isClient) return;

    const { map, L } = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      map.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach(markerData => {
      let emoji = '📍';
      let color = '#3B82F6';
      
      switch (markerData.type) {
        case 'pickup':
          emoji = '🚗';
          color = '#3B82F6';
          break;
        case 'dropoff':
        case 'destination':
          emoji = '🎯';
          color = '#EF4444';
          break;
        case 'current':
          emoji = '📍';
          color = '#10B981';
          break;
        case 'demo':
          emoji = '🎭';
          color = '#8B5CF6';
          break;
        default:
          emoji = '📍';
          color = '#6B7280';
      }

      // Create custom icon with emoji
      const icon = L.divIcon({
        html: `<div style="background: ${color}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 14px;">${emoji}</div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
      });

      const marker = L.marker([markerData.lat, markerData.lng], { icon })
        .addTo(map);

      if (markerData.title) {
        marker.bindPopup(markerData.title);
      }

      markersRef.current.push(marker);
    });
  }, [markers, isClient]);

  if (!isClient) {
    return (
      <div className="w-full h-[400px] bg-gray-100 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading FREE map...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapRef} 
      className={className}
      style={{ minHeight: '400px' }}
    />
  );
};

export default FreeMap;