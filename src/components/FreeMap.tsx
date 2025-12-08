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
      try {
        const L = (await import('leaflet')).default;

        // Fix Leaflet's default markers
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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
      } catch (error) {
        console.error('Failed to initialize map:', error);
      }
    };

    initializeMap();

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
          emoji = '🚕';
          color = '#FBBF24'; // Yellow
          break;
        case 'dropoff':
        case 'destination':
          emoji = '🏁';
          color = '#1F2937'; // Black
          break;
        case 'current':
          emoji = '📍';
          color = '#FBBF24'; // Yellow
          break;
        case 'demo':
          emoji = '🎭';
          color = '#F59E0B'; // Amber
          break;
        default:
          emoji = '🚖';
          color = '#FBBF24'; // Yellow
      }

      // Create custom taxi-themed icon with emoji
      const icon = L.divIcon({
        html: `<div style="background: ${color}; color: ${color === '#1F2937' ? '#FBBF24' : '#1F2937'}; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid ${color === '#1F2937' ? '#FBBF24' : '#1F2937'}; box-shadow: 0 4px 12px rgba(0,0,0,0.4); font-size: 16px; font-weight: bold;">${emoji}</div>`,
        className: '',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -18]
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
      <div className={`${className} bg-gray-100 flex items-center justify-center`}>
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
      style={{ 
        minHeight: '400px',
        height: '400px',
        position: 'relative',
        zIndex: 1
      }}
    />
  );
};

export default FreeMap;