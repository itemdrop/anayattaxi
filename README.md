# 🚖 AnayaTaxi - Complete Taxi Booking App

A modern, full-featured taxi booking application built with Next.js, featuring accurate location services and Gmail integration.

## ✨ Features

- **📍 Accurate Location Services**: Real-time GPS location with Google Maps integration
- **📧 Gmail Integration**: Automatic booking confirmations sent via email
- **📱 Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **🗺️ Interactive Maps**: Google Maps integration with location markers
- **📝 Smart Forms**: Form validation with real-time feedback
- **🚗 Multiple Car Types**: Economy, Comfort, Premium, and SUV options
- **⏰ Date & Time Picker**: Easy scheduling for future rides
- **📊 Booking Management**: Complete booking details and confirmation system

## 🛠️ Setup Instructions

### 1. Configure API Keys

Edit the `.env.local` file and add your API keys:

```env
# Google Maps API Key (Required)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key

# EmailJS Configuration (Required)
NEXT_PUBLIC_EMAILJS_USER_ID=your_emailjs_user_id
NEXT_PUBLIC_EMAILJS_SERVICE_ID=your_emailjs_service_id
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
NEXT_PUBLIC_EMAILJS_ADMIN_TEMPLATE_ID=your_admin_template_id

# Admin Email
NEXT_PUBLIC_ADMIN_EMAIL=your_admin_email@gmail.com
```

### 2. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable these APIs: Maps JavaScript API, Geocoding API, Places API
4. Create an API Key and copy it to `.env.local`

### 3. EmailJS Setup

1. Sign up at [EmailJS](https://www.emailjs.com/)
2. Create a Gmail service
3. Create customer and admin email templates
4. Copy service ID, template IDs, and user ID to `.env.local`

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📱 How to Use

1. **Location Access**: Allow location permissions when prompted
2. **Fill Form**: Enter passenger details and trip information
3. **Submit Booking**: Click "Book Taxi" to submit
4. **Email Confirmation**: Receive booking details via email

## 🚀 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

1. Connect your GitHub repository
2. Add environment variables in Vercel dashboard
3. Deploy automatically

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
