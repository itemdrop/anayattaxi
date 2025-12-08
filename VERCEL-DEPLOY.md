# 🚀 Deploy AnayaTaxi to Vercel

## Quick Vercel Deployment

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/itemdrop/anayattaxi)

## Manual Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click "New Project"
4. Import `itemdrop/anayattaxi` repository

### 2. Configure Environment Variables (Optional)
Add these environment variables in Vercel dashboard for email functionality:

```env
NEXT_PUBLIC_EMAILJS_USER_ID=your_emailjs_user_id
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id  
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_ADMIN_TEMPLATE_ID=your_admin_template_id
NEXT_PUBLIC_ADMIN_EMAIL=admin@yourdomain.com
```

**Note:** The app works perfectly without these - GPS and mapping are completely free and require no API keys!

### 3. Deploy
- Click "Deploy" 
- Vercel will automatically detect Next.js and deploy
- Your taxi app will be live in ~2 minutes!

## 🆓 What Works Out of the Box

✅ **FREE GPS Location Detection** - HTML5 Geolocation API  
✅ **FREE Interactive Maps** - OpenStreetMap + Leaflet  
✅ **FREE Address Lookup** - Nominatim geocoding  
✅ **Map Click Selection** - Pickup & dropoff points  
✅ **Responsive Design** - Mobile-first interface  
✅ **Form Validation** - Complete booking forms  

## 💡 Post-Deployment

Your app will be available at: `https://your-app-name.vercel.app`

**Features that work immediately:**
- 📍 GPS location detection
- 🗺️ Interactive map with click selection
- 🚗 Pickup location setting (1st click)
- 🎯 Dropoff location setting (2nd click) 
- 📱 Full mobile responsiveness
- ✅ Form validation and submission

**To enable email notifications:**
- Set up EmailJS account (free tier available)
- Add environment variables to Vercel
- Emails will automatically work

## 🛠️ Technical Details

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Maps**: Leaflet + OpenStreetMap (zero cost)
- **Location**: HTML5 Geolocation + Nominatim API
- **Deployment**: Optimized for Vercel Edge Functions
- **Performance**: Fast loading with code splitting

Your professional taxi booking app is now ready for production! 🚖✨