require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendNotification() {
  const user = {
    name: 'Dipanjana Das',
    email: 'dipanjana@earlyjobs.in',
    role: 'Admin',
    password: 'EJ!Dip@8060'
  };

  const mailOptions = {
    from: `"EarlyJobs Portal" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: '🚀 Credentials Updated - EarlyJobs CRM',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <h2 style="color: #FF6B00;">Credentials Updated</h2>
        <p>Hello <strong>${user.name}</strong>,</p>
        <p>Your password for the EarlyJobs CRM has been successfully regenerated as requested.</p>
        
        <div style="background-color: #f5f8fa; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px dashed #cbd6e2;">
          <p style="margin: 0; color: #516f90;">Your updated login details:</p>
          <p style="margin: 10px 0 0; font-weight: 700; font-size: 18px;">Email: ${user.email}</p>
          <p style="margin: 5px 0 0; font-weight: 700; font-size: 18px;">Password: ${user.password}</p>
        </div>

        <p>You can now sign in to the portal using the link below:</p>
        <a href="http://localhost:5173/login" style="display: inline-block; background-color: #FF6B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Sign In to Portal</a>
        
        <p style="margin-top: 30px; font-size: 12px; color: #7c98b6;">
          This is an automated notification. Please change your password after logging in if required.
        </p>
      </div>
    `
  };

  try {
    console.log(`Sending notification to ${user.email}...`);
    await transporter.sendMail(mailOptions);
    console.log('✅ Notification email sent successfully.');
  } catch (err) {
    console.error('❌ Email sending failed:', err.message);
  }
}

sendNotification();
