// Service for Malmö street name autocomplete and geocoding
export class MalmoStreetService {
  private static readonly MALMÖ_BOUNDS = {
    north: 55.65,
    south: 55.55,
    east: 13.1,
    west: 12.9
  };

  // Search for streets in Malmö using Nominatim
  static async searchStreets(query: string): Promise<Array<{
    display_name: string;
    lat: number;
    lon: number;
    address: string;
  }>> {
    if (!query || query.length < 2) return [];

    try {
      // Use Next.js API route to avoid CORS
      const response = await fetch(`/api/search-streets?q=${encodeURIComponent(query)}&city=malmo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Street search failed: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Street search error:', error);
      return [];
    }
  }

  // Validate if coordinates are within Malmö bounds
  static isInMalmo(lat: number, lon: number): boolean {
    return (
      lat >= this.MALMÖ_BOUNDS.south &&
      lat <= this.MALMÖ_BOUNDS.north &&
      lon >= this.MALMÖ_BOUNDS.west &&
      lon <= this.MALMÖ_BOUNDS.east
    );
  }

  // Format address for Malmö
  static formatMalmoAddress(address: string): string {
    // Ensure Malmö is included in the address
    if (!address.toLowerCase().includes('malmö') && !address.toLowerCase().includes('malmo')) {
      return `${address}, Malmö, Sweden`;
    }
    return address;
  }
}