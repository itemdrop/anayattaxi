import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    
    if (!lat || !lng) {
      return NextResponse.json({ error: 'Missing lat or lng parameters' }, { status: 400 });
    }

    console.log(`🌍 Reverse geocoding request: ${lat}, ${lng}`);

    // Try multiple geocoding services for better reliability
    let address = '';
    
    // Method 1: OpenStreetMap Nominatim (server-side to avoid CORS)
    try {
      console.log('🗺️ Trying OpenStreetMap Nominatim...');
      const osmResponse = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'AnayaTaxi-App/1.0 (https://anayataxi.vercel.app)',
            'Accept': 'application/json',
          },
          // Add timeout
          signal: AbortSignal.timeout(8000)
        }
      );
      
      if (osmResponse.ok) {
        const osmData = await osmResponse.json();
        if (osmData && osmData.display_name) {
          address = osmData.display_name;
          console.log('✅ OSM Success:', address);
        }
      }
    } catch (osmError) {
      console.warn('⚠️ OSM failed:', osmError);
    }

    // Method 2: Backup - try a different free geocoding service
    if (!address) {
      try {
        console.log('🌐 Trying backup geocoding service...');
        // Using a different approach - reverse geocoding via coordinates
        const backupResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
          {
            headers: {
              'Accept': 'application/json',
            },
            signal: AbortSignal.timeout(8000)
          }
        );
        
        if (backupResponse.ok) {
          const backupData = await backupResponse.json();
          if (backupData && backupData.city && backupData.countryName) {
            address = `${backupData.locality || backupData.city}, ${backupData.principalSubdivision || ''}, ${backupData.countryName}`.replace(', ,', ',');
            console.log('✅ Backup Success:', address);
          }
        }
      } catch (backupError) {
        console.warn('⚠️ Backup geocoding failed:', backupError);
      }
    }

    // Method 3: Final fallback - coordinate format
    if (!address) {
      address = `📍 ${parseFloat(lat).toFixed(4)}, ${parseFloat(lng).toFixed(4)}`;
      console.log('📍 Using coordinates as fallback:', address);
    }

    return NextResponse.json({ 
      address,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      success: true
    });

  } catch (error) {
    console.error('❌ Geocoding API error:', error);
    return NextResponse.json({ 
      error: 'Geocoding failed',
      address: `📍 Coordinates unavailable`,
      success: false
    }, { status: 500 });
  }
}