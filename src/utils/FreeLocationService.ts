// Free OpenStreetMap alternative for AnayaTaxi
// This can replace Google Maps entirely with zero cost

export class FreeLocationService {
  // Free reverse geocoding using OpenStreetMap Nominatim API
  static async getAddressFromCoords(lat: number, lng: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AnayaTaxi-App'
          }
        }
      );
      
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    } catch (error) {
      console.error('Free geocoding failed:', error);
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
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