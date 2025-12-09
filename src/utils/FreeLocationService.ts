// Free geocoding service for AnayaTaxi using server-side proxy
// This avoids CORS issues and provides backup geocoding services

export class FreeLocationService {
  // Reverse geocoding using our Next.js API endpoint (server-side proxy)
  static async getAddressFromCoords(lat: number, lng: number): Promise<string> {
    try {
      console.log(`🔍 Requesting address for: ${lat}, ${lng}`);
      
      // Use our API endpoint instead of direct external calls to avoid CORS
      const response = await fetch(`/api/geocode?lat=${lat}&lng=${lng}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for client-side request
        signal: AbortSignal.timeout(12000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.address) {
        console.log(`✅ Address resolved: ${data.address}`);
        return data.address;
      } else {
        console.warn('⚠️ API returned unsuccessful response:', data);
        return `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    } catch (error) {
      console.error('❌ Geocoding service failed:', error);
      // Return coordinates as fallback
      return `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    }
  }

  // Free forward geocoding (address to coordinates)
  static async getCoordsFromAddress(address: string): Promise<{lat: number, lng: number} | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'AnayaTaxi-App'
          }
        }
      );
      
      const data = await response.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
      return null;
    } catch (error) {
      console.error('Free address lookup failed:', error);
      return null;
    }
  }

  // Free map tiles (can replace Google Maps)
  static getMapTileUrl(x: number, y: number, z: number): string {
    return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  }
}

// Usage example:
// const address = await FreeLocationService.getAddressFromCoords(37.7749, -122.4194);
// const coords = await FreeLocationService.getCoordsFromAddress("San Francisco, CA");