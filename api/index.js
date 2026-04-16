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
            <p style="margin: 5px 0 0;">Password: ${user.password || 'Contact Admin'}</p>
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
  id: String, name: String, email: { type: String, unique: true }, role: String, password: String, avatar: String
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

const Qualification = mongoose.models.Qualification || mongoose.model('Qualification', new mongoose.Schema({
  leadId: { type: String, default: null },
  leadData: Object,
  type: { type: String, enum: ['FOFO', 'FOCO'], required: true },
  scores: [Number],
  openAnswers: [String],
  totalScore: { type: Number, default: 0 },
  qualificationStatus: { type: String, default: 'Not Recommended' },
  signature: { type: String, default: '' },
  date: { type: Date, default: Date.now }
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
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    const lead = await Lead.findOneAndUpdate(query, { ...req.body, updatedDate: Date.now() }, { new: true });
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/leads/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    await Lead.findOneAndDelete(query);
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
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    const f = await Franchisee.findOneAndUpdate(query, req.body, { new: true });
    res.json(f);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/franchisees/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    await Franchisee.findOneAndDelete(query);
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
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    const m = await Meeting.findOneAndUpdate(query, req.body, { new: true });
    res.json(m);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/meetings/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { _id: req.params.id } : { id: req.params.id };
    await Meeting.findOneAndDelete(query);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Auth & Users ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password });
    if (user) res.json(user);
    else res.status(401).json({ message: 'Invalid credentials' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users', async (req, res) => {
  try { res.json(await User.find()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/users/sdrs', async (req, res) => {
  try { res.json(await User.find({ role: 'SDR' })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { name, email, role, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    const user = new User({
      id: crypto.randomUUID(),
      name,
      email,
      role,
      password: password || 'EJ_TEMP_PWD_' + crypto.randomBytes(4).toString('hex'),
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF6B00&color=fff`
    });
    await user.save();

    try {
      await sendInvitationEmail(user);
      res.status(201).json({ ...user.toObject(), inviteSent: true });
    } catch (mailErr) {
      console.error('Mail sending failed:', mailErr);
      res.status(201).json({ ...user.toObject(), inviteSent: false, error: mailErr.message });
    }
  } catch (err) {
    res.status(400).json({ message: 'User creation failed', error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    const user = await User.findOneAndUpdate(query, req.body, { new: true });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/users/:id/resend-invite', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    const user = await User.findOne(query);
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
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    const task = await Task.findOneAndUpdate(query, req.body, { new: true });
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const query = mongoose.Types.ObjectId.isValid(req.params.id) ? { $or: [{ id: req.params.id }, { _id: req.params.id }] } : { id: req.params.id };
    await Task.findOneAndDelete(query);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

let sdrCounter = 0;
app.get('/api/users/next-sdr', async (req, res) => {
  try {
    const sdrs = await User.find({ role: 'SDR' });
    if (!sdrs.length) return res.status(404).json({ error: 'No SDRs' });
    const sdr = sdrs[sdrCounter % sdrs.length];
    sdrCounter++;
    res.json(sdr);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Qualifications ---
app.get('/api/qualifications', async (req, res) => {
  try { res.json(await Qualification.find().sort({ date: -1 })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/qualifications/:leadId', async (req, res) => {
  try { res.json(await Qualification.findOne({ leadId: req.params.leadId })); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/qualifications', async (req, res) => {
  try {
    const { leadId, leadData, ...data } = req.body;
    let targetId = leadId && leadId !== 'null' ? leadId : null;

    if (!targetId && leadData?.email) {
      const existingLead = await Lead.findOne({ email: leadData.email.toLowerCase() });
      if (existingLead) targetId = existingLead.id || existingLead._id;
    }

    let query = {};
    if (targetId) query = { leadId: targetId };
    else if (leadData?.email) query = { "leadData.email": leadData.email.toLowerCase() };
    else {
      const newQ = new Qualification({ leadId: null, leadData, ...data });
      await newQ.save();
      return res.status(201).json(newQ);
    }

    const q = await Qualification.findOneAndUpdate(
      query,
      { leadId: targetId, leadData, ...data },
      { upsert: true, new: true, runValidators: true }
    );
    
    console.log(`[QUALIFICATION] Saved for: ${targetId || leadData?.email}. Score: ${data.totalScore}`);

    // 4. Auto-update lead stage to 'Qualified' if score is high (>= 45)
    if (targetId && data.totalScore >= 45) {
      const Lead = mongoose.model('Lead');
      const leadToUpdate = await Lead.findOne({ $or: [{ id: targetId }, { _id: mongoose.Types.ObjectId.isValid(targetId) ? targetId : null }] });
      if (leadToUpdate && leadToUpdate.stage !== 'Qualified') {
        leadToUpdate.stage = 'Qualified';
        await leadToUpdate.save();
        console.log(`[QUALIFICATION] Lead ${targetId} automatically promoted to 'Qualified' stage.`);
      }
    }
    
    res.status(201).json(q);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

app.post('/api/qualifications/convert/:id', async (req, res) => {
  try {
    const q = await Qualification.findById(req.params.id);
    if (!q || !q.leadData) return res.status(404).json({ error: 'Data not found' });

    const admin = await User.findOne({ $or: [{ email: 'prajwal@earlyjobs.in' }, { role: 'Admin' }] });
    const newLead = new Lead({
      firstName: q.leadData.firstName,
      lastName: q.leadData.lastName,
      email: q.leadData.email,
      phone: q.leadData.phone,
      districtId: q.leadData.interestedDistrict,
      stage: 'Qualified',
      assignedTo: admin ? (admin.id || admin._id) : null,
      notes: `Converted from Qualification form. Status: ${q.qualificationStatus}. Score: ${q.totalScore}/60`
    });
    await newLead.save();
    q.leadId = newLead.id || newLead._id;
    q.leadData = undefined;
    await q.save();
    res.json(newLead);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// --- AI & Settings ---
const Setting = mongoose.models.Setting || mongoose.model('Setting', new mongoose.Schema({ key: String, value: String }));

app.get('/api/settings/ai-context', async (req, res) => {
  try {
    const s = await Setting.findOne({ key: 'ai_context' });
    res.json({ value: s ? s.value : '' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/settings/ai-context', async (req, res) => {
  try {
    await Setting.findOneAndUpdate({ key: 'ai_context' }, { value: req.body.value }, { upsert: true });
    res.sendStatus(200);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/ai/generate-strategy', async (req, res) => {
  try {
    const { leadDetails } = req.body;
    const context = await Setting.findOne({ key: 'ai_context' });
    const businessContext = context ? context.value : "EarlyJobs Franchise CRM";

    const prompt = `
    You are an expert sales assistant for EarlyJobs Franchise.
    Business Context (The Handbook):
    ${businessContext}

    Lead Details:
    - Name: ${leadDetails.firstName} ${leadDetails.lastName}
    - Profession: ${leadDetails.profession}
    - Location: ${leadDetails.districtName}
    - Stage: ${leadDetails.stage}
    - Capacity: ${leadDetails.investmentCapacity}
    - Current Notes: ${leadDetails.notes}

    Task:
    Provide a concise sales strategy including:
    1. A "Hook" based on their location and profession.
    2. A WhatsApp/Call script snippet.
    3. How to handle potential objections for this specific lead.
    4. Next best action.

    Format in Markdown. Keep it professional and punchy.
    `;

    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        system_instruction: {
          parts: [{ text: 'You are a highly experienced Senior Sales Strategist at EarlyJobs. Your goal is to provide punchy, human-sounding sales playbooks.' }]
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error?.message || 'AI API Error');
    }
    const data = await response.json();
    res.json({ strategy: data.candidates[0].content.parts[0].text });
  } catch (err) { 
    console.error('AI Strategy Error:', err.message);
    res.status(500).json({ message: err.message }); 
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    const apiKey = (process.env.Gemini_API_KEY || '').trim();
    if (!apiKey) throw new Error('Gemini API Key missing');

    const leads = await Lead.find({}, 'firstName lastName stage source profession investmentCapacity notes updatedDate').lean();
    const districts = await District.find({}, 'name status notes').lean();
    const franchisees = await Franchisee.find({}, 'name districtId committedAmount receivedAmount paymentStatus notes').lean();

    const crmData = {
      leadsTotal: leads.length,
      franchiseesTotal: franchisees.length,
      districtsTotal: districts.length,
      leads: leads,
      districts: districts,
      franchisees: franchisees
    };

    const systemPrompt = `You are the EarlyJobs CRM Insight Assistant. 
    Analyze the following CRM data to help users manage their franchise pipeline.
    CRM DATA: ${JSON.stringify(crmData)}
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        system_instruction: { parts: [{ text: systemPrompt }] }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'AI API Error');
    }

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text;
    res.json({ reply });
  } catch (err) { 
    console.error('AI Chat Error:', err.message);
    res.status(500).json({ message: err.message }); 
  }
});

module.exports = app;
