require('dotenv').config({ path: './server/.env' });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendInvitationEmail = async (user) => {
  const mailOptions = {
    from: '"EarlyJobs Portal" <' + process.env.SMTP_USER + '>',
    to: user.email,
    subject: '🚀 Welcome to EarlyJobs - You have been invited!',
    html: `
      <div style="font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #33475b; line-height: 1.6; border: 1px solid #eaf0f6; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">Welcome to EarlyJobs</h1>
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
          <p style="font-size: 16px;">Hello <strong>${user.name}</strong>,</p>
          <p>You have been invited to join the EarlyJobs Franchise Sales Management portal as a <strong>${user.role}</strong>.</p>
          
          <div style="background-color: #f5f8fa; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px dashed #cbd6e2;">
            <p style="margin: 0; color: #516f90; font-size: 14px;">Your temporary credentials:</p>
            <p style="margin: 10px 0 0; font-weight: 700; font-size: 18px;">Email: ${user.email}</p>
            <p style="margin: 5px 0 0; font-weight: 700; font-size: 18px;">Password: ${user.password || 'password123'}</p>
          </div>

          <p>Click the button below to sign in and start managing your leads.</p>
          
          <div style="text-align: center; margin-top: 32px;">
            <a href="http://localhost:5173/login" style="display: inline-block; background-color: #FF6B00; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700; box-shadow: 0 4px 12px rgba(255, 107, 0, 0.2);">Sign In to Portal</a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #eaf0f6; margin: 32px 0;" />
          
          <p style="font-size: 12px; color: #7c98b6; text-align: center;">
            This is an automated invitation. If you did not expect this, please ignore this email.
          </p>
        </div>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

const testUser = {
  name: 'Prajwal',
  email: 'prajwal@earlyjobs.in',
  role: 'Admin',
  password: 'testpassword123'
};

console.log('Sending sample mail to prajwal@earlyjobs.in...');
sendInvitationEmail(testUser)
  .then(info => {
    console.log('✅ Mail Sent Successfully:', info.messageId);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Mail Failed:', err);
    process.exit(1);
  });
