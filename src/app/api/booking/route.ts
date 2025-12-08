import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const bookingData = await request.json();
    
    // Create a nodemailer transporter (alternative to EmailJS)
    // You can use this if you prefer server-side email handling
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    });

    // Email content
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; color: white; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">🚖 AnayaTaxi</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Booking Confirmation</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Booking Details</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking ID:</strong> TX-${Date.now()}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 5px;">Passenger Information</h3>
          <p><strong>Name:</strong> ${bookingData.passengerName}</p>
          <p><strong>Phone:</strong> ${bookingData.passengerPhone}</p>
          <p><strong>Email:</strong> ${bookingData.passengerEmail}</p>
          
          <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 5px;">Trip Details</h3>
          <p><strong>Pickup Location:</strong> ${bookingData.pickupAddress}</p>
          <p><strong>Drop-off Location:</strong> ${bookingData.dropoffAddress}</p>
          <p><strong>Pickup Date:</strong> ${bookingData.pickupDate}</p>
          <p><strong>Pickup Time:</strong> ${bookingData.pickupTime}</p>
          <p><strong>Passengers:</strong> ${bookingData.passengers}</p>
          <p><strong>Car Type:</strong> ${bookingData.carType}</p>
          
          ${bookingData.specialRequests ? `
            <h3 style="color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 5px;">Special Requests</h3>
            <p>${bookingData.specialRequests}</p>
          ` : ''}
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3 style="margin: 0;">Thank you for choosing AnayaTaxi!</h3>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">We'll contact you shortly to confirm your booking.</p>
          </div>
          
          <p style="color: #666; font-size: 14px; text-align: center; margin-top: 30px;">
            If you have any questions, please contact us at info@anayataxi.com
          </p>
        </div>
      </div>
    `;

    // Send email to customer
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: bookingData.passengerEmail,
      subject: '🚖 AnayaTaxi - Booking Confirmation',
      html: htmlContent,
    });

    // Send email to admin
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'admin@anayataxi.com',
      subject: '🚖 New Taxi Booking - AnayaTaxi',
      html: htmlContent,
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Booking confirmation sent successfully!' 
    });

  } catch (error) {
    console.error('Error sending booking confirmation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to send booking confirmation.' },
      { status: 500 }
    );
  }
}