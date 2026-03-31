require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');

const Lead = require('./models/Lead');
const District = require('./models/District');
const Franchisee = require('./models/Franchisee');

const TaskSchema = new mongoose.Schema({
  title: String, leadId: String, franchiseeId: String, meetingId: String, 
  assignedTo: String, dueDate: Date, done: { type: Boolean, default: false }, createdDate: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

const MeetingSchema = new mongoose.Schema({
  leadId: String, eventType: String, eventLink: String, googleMeetLink: String, 
  scheduledDateTime: Date, attended: { type: Boolean, default: false }, createdDate: { type: Date, default: Date.now }
});
const Meeting = mongoose.model('Meeting', MeetingSchema);

const UserSchema = new mongoose.Schema({
  id: String, name: String, email: { type: String, unique: true }, role: String, password: String, avatar: String
});
const User = mongoose.model('User', UserSchema);

// Email Transporter (GMAIL Service)
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// --- API ROUTES ---

// Leads
app.get('/api/leads', async (req, res) => {
  const leads = await Lead.find().sort({ updatedDate: -1 });
  res.json(leads);
});

app.post('/api/leads', async (req, res) => {
  const lead = new Lead(req.body);
  await lead.save();
  res.status(201).json(lead);
});

app.put('/api/leads/:id', async (req, res) => {
  const updated = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

app.delete('/api/leads/:id', async (req, res) => {
  await Lead.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

// Districts
app.get('/api/districts', async (req, res) => {
  const districts = await District.find().sort({ name: 1 });
  res.json(districts);
});

app.put('/api/districts/:id', async (req, res) => {
  const updated = await District.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// Franchisees
app.get('/api/franchisees', async (req, res) => {
  const franchisees = await Franchisee.find().sort({ onboardingDate: -1 });
  res.json(franchisees);
});

app.post('/api/franchisees', async (req, res) => {
  try {
    const f = new Franchisee(req.body);
    await f.save();
    res.status(201).json(f);
  } catch (err) {
    res.status(400).json({ message: 'Franchisee creation failed', error: err.message });
  }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  const tasks = await Task.find().sort({ dueDate: 1 });
  res.json(tasks);
});
app.post('/api/tasks', async (req, res) => {
  const t = new Task(req.body);
  await t.save();
  res.status(201).json(t);
});

// Meetings
app.get('/api/meetings', async (req, res) => {
  const meetings = await Meeting.find().sort({ scheduledDateTime: 1 });
  res.json(meetings);
});

app.post('/api/meetings', async (req, res) => {
  const m = new Meeting(req.body);
  await m.save();
  res.status(201).json(m);
});

// Auth & Users
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) res.json(user);
  else res.status(401).json({ message: 'Invalid credentials' });
});

app.get('/api/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});

app.get('/api/users/sdrs', async (req, res) => {
  const sdrs = await User.find({ role: 'SDR' });
  res.json(sdrs);
});

let sdrCounter = 0;
app.get('/api/users/next-sdr', async (req, res) => {
  const sdrs = await User.find({ role: 'SDR' });
  if (!sdrs.length) return res.status(404).json({ message: 'No SDRs found' });
  const sdr = sdrs[sdrCounter % sdrs.length];
  sdrCounter++;
  res.json(sdr);
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });
    
    const user = new User({
      id: uuidv4(),
      name,
      email,
      role,
      password: password || 'password123',
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF6B00&color=fff`
    });
    await user.save();

    // Send Professional Invitation Email
    const mailOptions = {
      from: '"EarlyJobs Premium CRM" <' + process.env.SMTP_USER + '>',
      to: email,
      subject: 'Welcome to EarlyJobs Premium CRM - Invitation to Join',
      html: `
        <div style="font-family: 'Inter', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #33475b; line-height: 1.6;">
          <div style="background-color: #FF6B00; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 800;">EarlyJobs Premium CRM</h1>
          </div>
          <div style="padding: 40px; border: 1px solid #eaf0f6; border-top: none; border-radius: 0 0 8px 8px; background-color: #ffffff;">
            <h2 style="font-size: 20px; font-weight: 700; color: #000; margin-bottom: 24px;">Welcome, ${name}!</h2>
            <p>You have been invited to join the <strong>EarlyJobs Franchise CRM</strong> as an <strong>${role}</strong>.</p>
            <p>Our premium platform allows you to manage leads, track franchise partners, and monitor real-time analytics with world-class efficiency.</p>
            
            <div style="margin: 32px 0; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
              <p style="margin-top: 0; font-weight: 700; font-size: 13px; text-transform: uppercase; color: #7c98b6;">Your Access Credentials</p>
              <div style="font-size: 14px; margin-bottom: 8px;"><strong>Login Page:</strong> <a href="http://localhost:5173" style="color: #FF6B00;">http://localhost:5173</a></div>
              <div style="font-size: 14px; margin-bottom: 8px;"><strong>Email:</strong> ${email}</div>
              <div style="font-size: 14px;"><strong>Initial Password:</strong> ${password || 'password123'}</div>
            </div>

            <a href="http://localhost:5173" style="display: block; background-color: #FF6B00; color: white; text-align: center; padding: 14px; text-decoration: none; border-radius: 6px; font-weight: 700; font-size: 16px; margin: 32px 0;">Sign In Now</a>

            <hr style="border: none; border-top: 1px solid #eaf0f6; margin: 32px 0;" />
            <p style="font-size: 12px; color: #7c98b6; text-align: center;">
              This is an automated invitation. If you were not expecting this email, please contact your administrator.
            </p>
          </div>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(201).json({ ...user.toObject(), inviteSent: true });
    } catch (mailErr) {
      console.error('Mail sending failed:', mailErr);
      // Still return 201 as user was created, but flag the mail failure
      res.status(201).json({ ...user.toObject(), inviteSent: false, error: 'Invitation email failed to send (Check SMTP config)' });
    }
  } catch (err) {
    res.status(400).json({ message: 'User creation failed', error: err.message });
  }
});

// AI Context (Store in DB for persistence across devices)
const SettingSchema = new mongoose.Schema({ key: String, value: String });
const Setting = mongoose.model('Setting', SettingSchema);

app.get('/api/settings/ai-context', async (req, res) => {
  const s = await Setting.findOne({ key: 'ai_context' });
  res.json({ value: s ? s.value : '' });
});

app.post('/api/settings/ai-context', async (req, res) => {
  await Setting.findOneAndUpdate({ key: 'ai_context' }, { value: req.body.value }, { upsert: true });
  res.sendStatus(200);
});

// Bulk Operations
app.post('/api/leads/bulk', async (req, res) => {
  try {
    const results = await Lead.insertMany(req.body, { ordered: false });
    res.status(201).json(results);
  } catch (err) {
    res.status(400).json({ message: 'Bulk lead import failed', error: err.message });
  }
});

app.post('/api/districts/bulk', async (req, res) => {
  try {
    const results = await District.insertMany(req.body, { ordered: false });
    res.status(201).json(results);
  } catch (err) {
    res.status(400).json({ message: 'Bulk district import failed', error: err.message });
  }
});

app.post('/api/franchisees/bulk', async (req, res) => {
  try {
    const results = await Franchisee.insertMany(req.body, { ordered: false });
    res.status(201).json(results);
  } catch (err) {
    res.status(400).json({ message: 'Bulk franchisee import failed', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  🚀 CRM Backend Ready
  📡 Port: ${PORT}
  🔗 API: http://localhost:${PORT}/api
  `);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please kill the existing process or change the PORT in .env`);
    process.exit(1);
  }
});
