const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// --- EMAIL CONFIG ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendInvitationEmail = async (user) => {
  const mailOptions = {
    from: `"EarlyJobs Portal" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: '🚀 Welcome to EarlyJobs - You have been invited!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #33475b; line-height: 1.6; border: 1px solid #eaf0f6; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #FF6B00 0%, #FF8533 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to EarlyJobs</h1>
        </div>
        <div style="padding: 40px; background-color: #ffffff;">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You have been invited to join the EarlyJobs portal as a <strong>${user.role}</strong>.</p>
          <div style="background-color: #f5f8fa; padding: 24px; border-radius: 8px; margin: 24px 0; border: 1px dashed #cbd6e2;">
            <p style="margin: 0;">Email: ${user.email}</p>
            <p style="margin: 5px 0 0;">Password: ${user.password || 'password123'}</p>
          </div>
          <p>Click the button below to sign in.</p>
          <div style="text-align: center; margin-top: 32px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="display: inline-block; background-color: #FF6B00; color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-weight: 700;">Sign In to Portal</a>
          </div>
        </div>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

const sendTaskAssignmentEmail = async (user, task) => {
  const mailOptions = {
    from: `"EarlyJobs Task Assistant" <${process.env.SMTP_USER}>`,
    to: user.email,
    subject: `📋 New Task Assigned: ${task.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #33475b; border: 1px solid #eaf0f6; border-radius: 8px;">
        <div style="background-color: #FF6B00; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0;">New Task assigned</h2>
        </div>
        <div style="padding: 20px;">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>A new task has been assigned to you: <strong>${task.title}</strong></p>
          <p>Due Date: ${new Date(task.dueDate).toLocaleDateString()}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/tasks" style="display: inline-block; background-color: #FF6B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Tasks</a>
        </div>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

// --- DATABASE CONFIG ---
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI missing');
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    isConnected = conn.connections[0].readyState === 1;
  } catch (err) {
    isConnected = false;
    throw err;
  }
};

// --- MODELS ---
const Lead = mongoose.models.Lead || mongoose.model('Lead', new mongoose.Schema({
  id: String, firstName: String, lastName: String, phone: String, email: String, 
  districtId: String, stage: { type: String, default: 'New Lead' }, score: { type: Number, default: 0 },
  updatedDate: { type: Date, default: Date.now }
}, { strict: false }));

const District = mongoose.models.District || mongoose.model('District', new mongoose.Schema({
  id: String, name: String, status: { type: String, default: 'Available' }
}, { strict: false }));

const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  id: String, name: String, email: { type: String, unique: true }, role: String
}, { strict: false }));

const Task = mongoose.models.Task || mongoose.model('Task', new mongoose.Schema({
  id: String, title: String, leadId: String, franchiseeId: String, meetingId: String,
  assignedTo: String, dueDate: Date, done: { type: Boolean, default: false }, createdDate: { type: Date, default: Date.now }
}, { strict: false }));

const Franchisee = mongoose.models.Franchisee || mongoose.model('Franchisee', new mongoose.Schema({
  id: String, name: String, contactPerson: String, phone: String, email: String, districtId: String,
  onboardingDate: { type: Date, default: Date.now }, committedAmount: { type: Number, default: 0 },
  receivedAmount: { type: Number, default: 0 }, paymentStatus: { type: String, default: 'Partial' },
  notes: String, leadId: String, createdDate: { type: Date, default: Date.now }
}, { strict: false }));

const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', new mongoose.Schema({
  id: String, leadId: String, eventType: String, eventLink: String, googleMeetLink: String,
  scheduledDateTime: Date, attended: { type: Boolean, default: false }, createdDate: { type: Date, default: Date.now }
}, { strict: false }));

const app = express();
app.use(express.json());

// DB Middleware
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try { await connectDB(); next(); }
    catch (err) { res.status(500).json({ error: 'DB Error', details: err.message }); }
  } else next();
});

// --- API ---

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: isConnected ? 'Connected' : 'Disconnected' });
});

app.get('/api/leads', async (req, res) => {
  try { res.json(await Lead.find().sort({ updatedDate: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leads', async (req, res) => {
  try { 
    const lead = new Lead({ ...req.body, id: crypto.randomUUID(), updatedDate: Date.now() });
    await lead.save();
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const lead = await Lead.findOneAndUpdate({ $or: [{ id }, { _id: id }] }, { ...req.body, updatedDate: Date.now() }, { new: true });
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    await Lead.findOneAndDelete({ $or: [{ id: req.params.id }, { _id: req.params.id }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leads/bulk', async (req, res) => {
  try {
    const leads = req.body.map(l => ({ ...l, id: l.id || crypto.randomUUID(), updatedDate: Date.now() }));
    const result = await Lead.insertMany(leads, { ordered: false });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leads/bulk-delete', async (req, res) => {
  try {
    await Lead.deleteMany({ $or: [{ id: { $in: req.body } }, { _id: { $in: req.body } }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/districts', async (req, res) => {
  try { res.json(await District.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/districts/bulk', async (req, res) => {
  try {
    const districts = req.body.map(d => ({ ...d, id: d.id || crypto.randomUUID() }));
    const result = await District.insertMany(districts, { ordered: false });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/districts/bulk-delete', async (req, res) => {
  try {
    await District.deleteMany({ $or: [{ id: { $in: req.body } }, { _id: { $in: req.body } }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Franchisees ---
app.get('/api/franchisees', async (req, res) => {
  try { res.json(await Franchisee.find().sort({ onboardingDate: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/franchisees', async (req, res) => {
  try {
    const f = new Franchisee({ ...req.body, id: crypto.randomUUID() });
    await f.save(); res.json(f);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/franchisees/:id', async (req, res) => {
  try {
    const f = await Franchisee.findOneAndUpdate({ $or: [{ id: req.params.id }, { _id: req.params.id }] }, req.body, { new: true });
    res.json(f);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/franchisees/:id', async (req, res) => {
  try {
    await Franchisee.findOneAndDelete({ $or: [{ id: req.params.id }, { _id: req.params.id }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/franchisees/bulk', async (req, res) => {
  try {
    const items = req.body.map(f => ({ ...f, id: f.id || crypto.randomUUID() }));
    const result = await Franchisee.insertMany(items, { ordered: false });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/franchisees/bulk-delete', async (req, res) => {
  try {
    await Franchisee.deleteMany({ $or: [{ id: { $in: req.body } }, { _id: { $in: req.body } }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Meetings ---
app.get('/api/meetings', async (req, res) => {
  try { res.json(await Meeting.find().sort({ scheduledDateTime: 1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/meetings', async (req, res) => {
  try {
    const m = new Meeting({ ...req.body, id: crypto.randomUUID() });
    await m.save(); res.json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/meetings/:id', async (req, res) => {
  try {
    const m = await Meeting.findOneAndUpdate({ $or: [{ id: req.params.id }, { _id: req.params.id }] }, req.body, { new: true });
    res.json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/meetings/:id', async (req, res) => {
  try {
    await Meeting.findOneAndDelete({ $or: [{ id: req.params.id }, { _id: req.params.id }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users', async (req, res) => {
  try { res.json(await User.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const user = new User({ ...req.body, id: crypto.randomUUID() });
    await user.save(); res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ $or: [{ id: req.params.id }, { _id: req.params.id }] }, req.body, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/:id/resend-invite', async (req, res) => {
  try {
    const user = await User.findOne({ $or: [{ id: req.params.id }, { _id: req.params.id }] });
    if (!user) throw new Error('User not found');
    await sendInvitationEmail(user);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/bulk-delete', async (req, res) => {
  try {
    await User.deleteMany({ $or: [{ id: { $in: req.body } }, { _id: { $in: req.body } }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/tasks', async (req, res) => {
  try { res.json(await Task.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task({ ...req.body, id: crypto.randomUUID() });
    await task.save();
    if (task.assignedTo) {
      const user = await User.findOne({ id: task.assignedTo });
      if (user && user.email) sendTaskAssignmentEmail(user, task).catch(e => console.error('Task Email Error:', e));
    }
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate({ $or: [{ id: req.params.id }, { _id: req.params.id }] }, req.body, { new: true });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findOneAndDelete({ $or: [{ id: req.params.id }, { _id: req.params.id }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/next-sdr', async (req, res) => {
  try {
    const sdrs = await User.find({ role: 'SDR' });
    if (!sdrs.length) return res.status(404).json({ error: 'No SDRs' });
    // Quick random SDR for rotation
    const sdr = sdrs[Math.floor(Math.random() * sdrs.length)];
    res.json(sdr);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const prompt = req.body.prompt || (req.body.messages && req.body.messages[req.body.messages.length - 1]?.content);
    const key = (process.env.Gemini_API_KEY || '').trim();
    if (!key) throw new Error('API Key missing');
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    res.json({ reply: result.response.text() });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = app;
