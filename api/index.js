require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// --- DATABASE CONFIG ---
let isConnected = false;
const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is missing');
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    isConnected = conn.connections[0].readyState === 1;
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error(`❌ Connection Error: ${err.message}`);
    isConnected = false;
    throw err;
  }
};

// --- MODELS ---
const LeadSchema = new mongoose.Schema({
  id: String, firstName: { type: String, default: '' }, lastName: { type: String, default: '' },
  phone: { type: String, default: '' }, email: String, districtId: String,
  profession: String, investmentCapacity: String, source: String,
  stage: { type: String, default: 'New Lead' }, score: { type: Number, default: 0 },
  assignedTo: String, notes: String, createdDate: { type: Date, default: Date.now }, updatedDate: { type: Date, default: Date.now }
});
const Lead = mongoose.models.Lead || mongoose.model('Lead', LeadSchema);

const DistrictSchema = new mongoose.Schema({
  id: String, name: String, state: String, region: String, 
  status: { type: String, default: 'Available' }, assignedTo: String, quota: Number,
  pricing: { franchiseFee: Number, loyaltyFee: Number }
});
const District = mongoose.models.District || mongoose.model('District', DistrictSchema);

const FranchiseeSchema = new mongoose.Schema({
  id: String, name: String, leadId: String, districtId: String, contactPerson: String,
  email: String, phone: String, status: { type: String, default: 'Pending' }, 
  agreementDate: Date, paymentStatus: { type: String, default: 'Unpaid' }
});
const Franchisee = mongoose.models.Franchisee || mongoose.model('Franchisee', FranchiseeSchema);

const TaskSchema = new mongoose.Schema({
  id: String, title: String, leadId: String, franchiseeId: String,
  assignedTo: String, dueDate: Date, done: { type: Boolean, default: false }, createdDate: { type: Date, default: Date.now }
});
const Task = mongoose.models.Task || mongoose.model('Task', TaskSchema);

const UserSchema = new mongoose.Schema({
  id: String, name: String, email: { type: String, unique: true }, role: String, password: String
});
const User = mongoose.models.User || mongoose.model('User', UserSchema);

// --- APP SETUP ---
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));

// DB Middleware
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try { await connectDB(); next(); }
    catch (err) { res.status(500).json({ error: 'DB Connection Failed', details: err.message }); }
  } else next();
});

// --- ROUTES ---

// Health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', database: isConnected ? 'Connected' : 'Disconnected' });
});

// Leads
app.get('/api/leads', async (req, res) => {
  try { res.json(await Lead.find().sort({ updatedDate: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leads', async (req, res) => {
  try { 
    const data = { ...req.body, id: uuidv4() };
    const lead = new Lead(data);
    await lead.save();
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const update = { ...req.body, updatedDate: Date.now() };
    const lead = await Lead.findOneAndUpdate({ $or: [{ id }, { _id: id }] }, update, { new: true });
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Lead.findOneAndDelete({ $or: [{ id }, { _id: id }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, prompt: directPrompt } = req.body;
    const prompt = directPrompt || (messages && messages[messages.length - 1]?.content);
    if (!prompt) throw new Error('No prompt provided');

    const key = (process.env.Gemini_API_KEY || '').trim();
    if (!key) throw new Error('Gemini API Key missing');

    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ reply: text });
  } catch (err) {
    console.error('AI Chat Error:', err.message);
    res.status(500).json({ message: 'AI Chat failed', details: err.message });
  }
});

// Districts
app.get('/api/districts', async (req, res) => {
  try { res.json(await District.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Franchisees
app.get('/api/franchisees', async (req, res) => {
  try { res.json(await Franchisee.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

// Users
app.get('/api/users', async (req, res) => {
  try { res.json(await User.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const userData = { ...req.body, id: uuidv4() };
    const user = new User(userData);
    await user.save();
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const user = await User.findOneAndUpdate({ $or: [{ id }, { _id: id }] }, req.body, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await User.findOneAndDelete({ $or: [{ id }, { _id: id }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  try { res.json(await Task.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task({ ...req.body, id: uuidv4() });
    await task.save();
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findOneAndUpdate({ $or: [{ id }, { _id: id }] }, req.body, { new: true });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const id = req.params.id;
    await Task.findOneAndDelete({ $or: [{ id }, { _id: id }] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = app;
