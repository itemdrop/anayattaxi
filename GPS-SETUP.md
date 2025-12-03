# 🛠️ GPS and Location Setup Guide

## Quick GPS Troubleshooting

### 1. **Browser Permissions**
- **Chrome/Safari**: Click the 🔒 lock icon in the address bar → Allow Location
- **Firefox**: Click the shield icon → Allow Location Access  
- **Edge**: Click the location icon in the address bar → Allow

### 2. **Test Your Setup**
1. Open the app at `http://localhost:3000`
2. Click "🎭 Use Demo Location" to test without GPS
3. Click "Get My Location" to test real GPS
4. Check browser console (F12) for any error messages

### 3. **Common Issues & Solutions**

#### ❌ "Location access denied"
**Solution**: 
- Clear browser permissions for localhost
- Refresh page and allow location when prompted
- Try in incognito/private browsing mode

#### ❌ "Location information is unavailable"  
**Solution**:
- Check if GPS is enabled on your device
- Try different browser (Chrome usually works best)
- Ensure you have internet connection

#### ❌ "Location request timed out"
**Solution**:
- Move to area with better GPS signal (near window)
- Try the demo location button first
- Check if location services are enabled system-wide

#### ❌ Map shows placeholder
**Solution**:
- Get Google Maps API key (see main README.md)
- Add it to `.env.local` file
- Restart the development server

### 4. **Testing Without GPS**
The app includes a **Demo Location** button that sets:
- Location: San Francisco, CA  
- Coordinates: 37.7749, -122.4194
- Perfect for testing the booking flow

### 5. **Development Tips**
```bash
# Check if location is working in browser console:
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('GPS OK:', pos.coords),
  (err) => console.error('GPS Error:', err)
);
```

### 6. **Production Deployment**
For production (HTTPS), GPS works more reliably:
- Deploy to Vercel/Netlify  
- Test on real mobile devices
- HTTPS enables better location accuracy

### 7. **API Key Setup (Optional but Recommended)**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable: Maps JavaScript API, Geocoding API  
3. Create API Key
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_key_here
   ```

The app works without API key but with limited features.

---

**Still having issues?** The app includes manual address entry as a fallback!