const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const prisma = new PrismaClient();

// Configure Transporter (Email)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: process.env.SMTP_PORT || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Configure Twilio (SMS)
const twilioClient = process.env.TWILIO_SID && process.env.TWILIO_TOKEN 
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN) 
  : null;

/**
 * Send real-time alerts to users based on their preferences
 * @param {Object} event The disaster event
 */
async function dispatchAlerts(event) {
  console.log(`🔔 Dispatching alerts for event: ${event.title}`);

  // Fetch users whose location matches the event's location (within their radius)
  // For simplicity in this demo, we'll fetch all users with active alerts
  const users = await prisma.user.findMany({
    include: { preferences: true },
    where: {
      preferences: {
        OR: [
          { emailAlerts: true },
          { smsAlerts: true }
        ]
      }
    }
  });

  for (const user of users) {
    const prefs = user.preferences;
    if (!prefs) continue;

    // Filter by disaster type
    const activeTypes = (prefs.disasterTypes || '').split(',');
    if (activeTypes.length > 0 && !activeTypes.includes(event.type)) {
       // Check if event title contains the type as a fallback
       if (!activeTypes.some(t => event.title.toLowerCase().includes(t.toLowerCase()))) {
         continue;
       }
    }

    // Email Alert
    if (prefs.emailAlerts && user.email) {
      await sendEmail(user.email, event);
    }

    // SMS Alert
    if (prefs.smsAlerts && prefs.phoneNumber) {
      await sendSMS(prefs.phoneNumber, event);
    }
  }
}

/**
 * Mock Email sending
 */
async function sendEmail(email, event) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`📧 [MOCK EMAIL] To: ${email} | Subject: EMERGENCY ALERT: ${event.type.toUpperCase()} | Message: ${event.title}`);
    return true;
  }

  try {
    await transporter.sendMail({
      from: `"DisasterIntel Alert" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `⚠️ EMERGENCY ALERT: ${event.type.toUpperCase()} - ${event.title}`,
      text: `Urgent Alert from DisasterIntel.\n\nDescription: ${event.description || event.title}\nSeverity: ${event.severity}\nLocation: https://www.google.com/maps?q=${event.latitude},${event.longitude}\n\nStay alert and follow local safety guidelines.`,
      html: `<div style="font-family: sans-serif; padding: 20px; border-radius: 12px; background: #fafafa; border: 1px solid #eee;">
        <h2 style="color: #ef4444;">🚨 Urgent Disaster Alert</h2>
        <p>A new <strong>${event.type}</strong> has been detected in your monitored region.</p>
        <p style="background: #fff; padding: 15px; border-radius: 8px; font-weight: bold;">${event.title}</p>
        <p><strong>Severity:</strong> ${event.severity}</p>
        <p><a href="https://www.google.com/maps?q=${event.latitude},${event.longitude}" style="color: #6366f1; text-decoration: none; font-weight: bold;">View on Map →</a></p>
        <hr style="border: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 0.8rem; color: #666;">This is an automated alert from your DisasterIntel Dashboard.</p>
      </div>`
    });
    console.log(`📧 [API EMAIL] Successfully sent to ${email}`);
    return true;
  } catch (err) {
    console.error(`❌ [EMAIL ERROR] Failed to send to ${email}:`, err.message);
    return false;
  }
}

/**
 * Send SMS (via Twilio)
 */
async function sendSMS(phone, event) {
  if (!twilioClient || !process.env.TWILIO_FROM) {
    console.log(`📱 [MOCK SMS] To: ${phone} | Message: ALERT: ${event.title}. Stay safe!`);
    return true;
  }

  try {
    await twilioClient.messages.create({
      body: `🚨 DisasterIntel Alert: ${event.title}. Severity: ${event.severity}. Stay safe!`,
      from: process.env.TWILIO_FROM,
      to: phone
    });
    console.log(`📱 [API SMS] Successfully sent to ${phone}`);
    return true;
  } catch (err) {
    console.error(`❌ [SMS ERROR] Failed to send to ${phone}:`, err.message);
    return false;
  }
}

module.exports = { dispatchAlerts };
