import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const city = searchParams.get('city');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
    // Search specifically in Malmö, Sweden with street focus
    const nominatimUrl = new URL('https://nominatim.openstreetmap.org/search');
    
    // Focus search on Malmö with specific parameters
    const searchQuery = city === 'malmo' 
      ? `${query}, Malmö, Sweden`
      : query;
    
    nominatimUrl.searchParams.set('q', searchQuery);
    nominatimUrl.searchParams.set('format', 'json');
    nominatimUrl.searchParams.set('limit', '8');
    nominatimUrl.searchParams.set('addressdetails', '1');
    nominatimUrl.searchParams.set('countrycodes', 'se'); // Sweden only
    
    // Focus on Malmö coordinates
    if (city === 'malmo') {
      nominatimUrl.searchParams.set('viewbox', '12.9,55.65,13.1,55.55'); // Malmö bounding box
      nominatimUrl.searchParams.set('bounded', '1');
    }

    console.log('Searching streets:', nominatimUrl.toString());

    const response = await fetch(nominatimUrl.toString(), {
      headers: {
        'User-Agent': 'AnayaTaxiApp/1.0 (contact@anayataxi.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Process results to focus on streets and addresses
    const processedResults = data
      .filter((item: any) => {
        // Filter for streets, addresses, and places in Malmö
        const isStreet = item.class === 'highway' || item.class === 'place' || item.type === 'residential';
        const isInMalmo = item.display_name.toLowerCase().includes('malmö') || 
                         item.display_name.toLowerCase().includes('malmo');
        return isStreet || isInMalmo;
      })
      .slice(0, 6) // Limit to 6 results
      .map((item: any) => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        address: item.display_name.split(',')[0], // Just the street part
        full_address: item.display_name,
        type: item.type,
        class: item.class
      }));

    return NextResponse.json({ 
      results: processedResults,
      count: processedResults.length 
    });

  } catch (error) {
    console.error('Street search API error:', error);
    return NextResponse.json(
      { error: 'Failed to search streets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}