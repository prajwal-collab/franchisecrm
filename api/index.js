const express = require('express');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const crypto = require('crypto');

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
  id: String, title: String, leadId: String, done: { type: Boolean, default: false }
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

app.get('/api/districts', async (req, res) => {
  try { res.json(await District.find()); } catch (err) { res.status(500).json({ error: err.message }); }
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

app.get('/api/tasks', async (req, res) => {
  try { res.json(await Task.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = new Task({ ...req.body, id: crypto.randomUUID() });
    await task.save(); res.json(task);
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
