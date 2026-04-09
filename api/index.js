import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import nodemailer from 'nodemailer';
import { v4 as uuidv4 } from 'uuid';
// Global fetch is available in Node 18+ on Vercel

// --- SCHEMAS ---
const LeadSchema = new mongoose.Schema({
  id: String, firstName: String, lastName: String, phone: String, email: String, 
  districtId: String, districtName: String, profession: String, investmentCapacity: String, 
  source: String, stage: String, score: Number, notes: String, assignedTo: String, assignedToName: String, 
  createdDate: { type: Date, default: Date.now }, updatedDate: { type: Date, default: Date.now }
});
const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

const DistrictSchema = new mongoose.Schema({
  id: String, name: String, status: { type: String, default: 'Available' }, 
  soldDate: String, franchiseeId: String, franchiseeName: String, notes: String, createdDate: { type: Date, default: Date.now }
});
const District = mongoose.models.District || mongoose.model('District', DistrictSchema);

const FranchiseeSchema = new mongoose.Schema({
  id: String, name: String, phone: String, email: String, districtId: String, districtName: String, 
  onboardingDate: { type: Date, default: Date.now }, committedAmount: Number, receivedAmount: Number, paymentStatus: String, notes: String
});
const Franchisee = mongoose.models.Franchisee || mongoose.model('Franchisee', FranchiseeSchema);

const TaskSchema = new mongoose.Schema({
  id: String, title: String, leadId: String, franchiseeId: String, meetingId: String, 
  assignedTo: String, dueDate: Date, done: { type: Boolean, default: false }, createdDate: { type: Date, default: Date.now }
});
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

const MeetingSchema = new mongoose.Schema({
  id: String, leadId: String, eventType: String, eventLink: String, googleMeetLink: String, 
  scheduledDateTime: Date, attended: { type: Boolean, default: false }, createdDate: { type: Date, default: Date.now }
});
const Meeting = mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);

const UserSchema = new mongoose.Schema({
  id: String, name: String, email: { type: String, unique: true }, role: String, password: String, avatar: String
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const SettingSchema = new mongoose.Schema({ key: String, value: String });
const Setting = mongoose.models.Setting || mongoose.model('Setting', SettingSchema);

// --- APP INIT ---
const app = express();
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.options('*', cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
app.use(morgan('dev'));

// PREVENT CACHING 
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// --- DB CONNECTION ---
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is missing');
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    isConnected = conn.connections[0].readyState === 1;
  } catch (err) {
    isConnected = false;
    throw err;
  }
};

app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try { await connectDB(); next(); } 
    catch (err) { res.status(500).json({ message: 'Database connection failed', details: err.message }); }
  } else { next(); }
});

// --- HELPER FUNCTIONS ---
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, port: parseInt(process.env.SMTP_PORT), secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// --- ROUTES ---
app.get('/api/health', (req, res) => res.json({ status: 'ok', database: isConnected ? 'Connected' : 'Disconnected', env: { has_uri: !!process.env.MONGODB_URI } }));

app.get('/api/leads', async (req, res) => {
  try { res.json(await Lead.find().sort({ updatedDate: -1 })); } 
  catch (err) { res.status(500).json({ message: 'Failed to fetch leads', details: err.message }); }
});

app.post('/api/leads/bulk', async (req, res) => {
  try { res.status(201).json(await Lead.insertMany(req.body, { ordered: false })); } 
  catch (err) {
    if (err.name === 'MongoBulkWriteError' || err.code === 11000) return res.status(201).json(err.insertedDocs || []);
    res.status(400).json({ message: 'Bulk import failed', details: err.message });
  }
});

app.post('/api/leads/bulk-delete', async (req, res) => {
  try { await Lead.deleteMany({ $or: [{ id: { $in: req.body } }, { _id: { $in: req.body } }] }); res.status(204).send(); } 
  catch (err) { res.status(400).json({ message: 'Bulk delete failed' }); }
});

app.post('/api/leads', async (req, res) => { const lead = new Lead(req.body); await lead.save(); res.status(201).json(lead); });
app.put('/api/leads/:id', async (req, res) => { const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id }; res.json(await Lead.findOneAndUpdate(query, req.body, { new: true })); });
app.delete('/api/leads/:id', async (req, res) => { const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id }; await Lead.findOneAndDelete(query); res.status(204).send(); });

// Districts
app.get('/api/districts', async (req, res) => {
  try { res.json(await District.find().sort({ name: 1 }).lean()); } 
  catch (err) { res.status(500).json({ message: 'Failed to fetch districts', details: err.message }); }
});

app.post('/api/districts/bulk', async (req, res) => {
  try { res.status(201).json(await District.insertMany(req.body, { ordered: false })); } 
  catch (err) {
    if (err.name === 'MongoBulkWriteError' || err.code === 11000) return res.status(201).json(err.insertedDocs || []);
    res.status(400).json({ message: 'Bulk import failed', details: err.message });
  }
});

app.post('/api/districts/bulk-delete', async (req, res) => {
  try { await District.deleteMany({ $or: [{ id: { $in: req.body } }, { _id: { $in: req.body } }] }); res.status(204).send(); } 
  catch (err) { res.status(400).json({ message: 'Bulk delete failed' }); }
});

app.post('/api/districts', async (req, res) => { const d = new District(req.body); await d.save(); res.status(201).json(d); });
app.put('/api/districts/:id', async (req, res) => { const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id }; res.json(await District.findOneAndUpdate(query, req.body, { new: true })); });
app.delete('/api/districts/:id', async (req, res) => { const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id }; await District.findOneAndDelete(query); res.status(204).send(); });

// Franchisees
app.get('/api/franchisees', async (req, res) => {
  try { res.json(await Franchisee.find().sort({ onboardingDate: -1 })); } 
  catch (err) { res.status(500).json({ message: 'Failed to fetch franchisees', details: err.message }); }
});

app.post('/api/franchisees/bulk', async (req, res) => {
  try { res.status(201).json(await Franchisee.insertMany(req.body, { ordered: false })); } 
  catch (err) {
    if (err.name === 'MongoBulkWriteError' || err.code === 11000) return res.status(201).json(err.insertedDocs || []);
    res.status(400).json({ message: 'Bulk import failed', details: err.message });
  }
});

app.post('/api/franchisees/bulk-delete', async (req, res) => {
  try { await Franchisee.deleteMany({ $or: [{ id: { $in: req.body } }, { _id: { $in: req.body } }] }); res.status(204).send(); } 
  catch (err) { res.status(400).json({ message: 'Bulk delete failed' }); }
});

app.post('/api/franchisees', async (req, res) => { const f = new Franchisee(req.body); await f.save(); res.status(201).json(f); });
app.put('/api/franchisees/:id', async (req, res) => { const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id }; res.json(await Franchisee.findOneAndUpdate(query, req.body, { new: true })); });
app.delete('/api/franchisees/:id', async (req, res) => { const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id }; await Franchisee.findOneAndDelete(query); res.status(204).send(); });

// Tasks & Meetings 
app.get('/api/tasks', async (req, res) => res.json(await Task.find().sort({ dueDate: 1 })));
app.post('/api/tasks', async (req, res) => { const t = new Task(req.body); await t.save(); res.status(201).json(t); });
app.put('/api/tasks/:id', async (req, res) => res.json(await Task.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/tasks/:id', async (req, res) => { await Task.findByIdAndDelete(req.params.id); res.status(204).send(); });

app.get('/api/meetings', async (req, res) => res.json(await Meeting.find().sort({ scheduledDateTime: 1 }).lean()));
app.post('/api/meetings', async (req, res) => { const m = new Meeting(req.body); await m.save(); res.status(201).json(m); });
app.put('/api/meetings/:id', async (req, res) => res.json(await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true })));
app.delete('/api/meetings/:id', async (req, res) => { await Meeting.findByIdAndDelete(req.params.id); res.status(204).send(); });

// Auth
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email, password });
  if (user) res.json(user); else res.status(401).json({ message: 'Invalid credentials' });
});

app.get('/api/users', async (req, res) => res.json(await User.find()));
app.get('/api/users/sdrs', async (req, res) => res.json(await User.find({ role: 'SDR' })));

// Gemini AI
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const leads = await Lead.find({}, 'firstName lastName stage notes').limit(10).lean();
    const crmData = { leadsTotal: leads.length, leadsPreview: leads };
    const systemPrompt = `You are the EarlyJobs CRM Insight Assistant. Context: ${JSON.stringify(crmData)}`;
    const GEMINI_API_KEY = (process.env.Gemini_API_KEY || '').trim();
    if (!GEMINI_API_KEY) return res.status(400).json({ message: 'API Key missing' });
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        system_instruction: { parts: [{ text: systemPrompt }] }
      })
    });
    const data = await response.json();
    if (!data.candidates || !data.candidates[0]) {
      throw new Error('AI API returned an empty or blocked response. Check your API key and safety settings.');
    }
    res.json({ reply: data.candidates[0].content.parts[0].text });
  } catch (err) { res.status(500).json({ message: 'AI Chat failed', details: err.message }); }
});

export default app;
