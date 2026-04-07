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
  id: String, // Compatibility with legacy records
  title: String, leadId: String, franchiseeId: String, meetingId: String, 
  assignedTo: String, dueDate: Date, done: { type: Boolean, default: false }, createdDate: { type: Date, default: Date.now }
});
const Task = mongoose.model('Task', TaskSchema);

const MeetingSchema = new mongoose.Schema({
  id: String, // Compatibility with legacy records
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
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors()); // Handle preflight requests for all routes
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));
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

app.put('/api/franchisees/:id', async (req, res) => {
  try {
    const updated = await Franchisee.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Franchisee not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Update failed', error: err.message });
  }
});

app.delete('/api/franchisees/:id', async (req, res) => {
  try {
    const deleted = await Franchisee.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Franchisee not found' });
    res.status(204).send();
  } catch (err) {
    res.status(400).json({ message: 'Deletion failed', error: err.message });
  }
});

// Tasks
app.get('/api/tasks', async (req, res) => {
  const tasks = await Task.find().sort({ dueDate: 1 });
  res.json(tasks);
});
app.post('/api/tasks', async (req, res) => {
  try {
    const t = new Task(req.body);
    await t.save();
    
    // Notify assignee via email
    if (t.assignedTo) {
      const user = await User.findOne({ id: t.assignedTo });
      if (user && user.email) {
        sendTaskAssignmentEmail(user, t).catch(err => console.error('Task Email Failed:', err));
      }
    }
    
    res.status(201).json(t);
  } catch (err) {
    res.status(400).json({ message: 'Task creation failed' });
  }
});
app.put('/api/tasks/:id', async (req, res) => {
  const previousTask = await Task.findById(req.params.id);
  const updated = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true });
  
  // If assignee changed, notify the new one
  if (updated.assignedTo && updated.assignedTo !== previousTask?.assignedTo) {
    const user = await User.findOne({ id: updated.assignedTo });
    if (user) sendTaskAssignmentEmail(user, updated).catch(err => console.error('Task Update Email Failed:', err));
  }
  
  res.json(updated);
});
app.delete('/api/tasks/:id', async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).send();
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

const sendInvitationEmail = async (user) => {
  // ... existing invitation email logic ...
};

const sendTaskAssignmentEmail = async (user, task) => {
  const mailOptions = {
    from: '"EarlyJobs Task Assistant" <' + process.env.SMTP_USER + '>',
    to: user.email,
    subject: `📋 New Task Assigned: ${task.title}`,
    html: `
      <div style="font-family: 'Plus Jakarta Sans', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #33475b; line-height: 1.6; border: 1px solid #eaf0f6; border-radius: 8px;">
        <div style="background-color: #FF6B00; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h2 style="color: white; margin: 0; font-size: 20px;">Management Alert</h2>
        </div>
        <div style="padding: 30px; background-color: #ffffff;">
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>A new task has been assigned to you in the EarlyJobs CRM.</p>
          
          <div style="background-color: #f5f8fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin-top: 0;"><strong>Task:</strong> ${task.title}</p>
            <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>

          <a href="http://localhost:5173/tasks" style="display: inline-block; background-color: #FF6B00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 700;">View Task List</a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #7c98b6;">
            This is an automated notification. Please do not reply directly to this email.
          </p>
        </div>
      </div>
    `
  };
  return transporter.sendMail(mailOptions);
};

let sdrCounter = 0;
app.get('/api/users/next-sdr', async (req, res) => {
  const sdrs = await User.find({ role: 'SDR' });
  if (!sdrs.length) return res.status(404).json({ message: 'No SDRs found' });
  const sdr = sdrs[sdrCounter % sdrs.length];
  sdrCounter++;
  res.json(sdr);
});

app.post('/api/users/:id/resend-invite', async (req, res) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await sendInvitationEmail(user);
    res.json({ success: true, message: 'Invitation email re-sent successfully' });
  } catch (err) {
    console.error('Mail resending failed:', err);
    res.status(500).json({ message: 'Failed to resend invitation email', error: err.message });
  }
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

    try {
      await sendInvitationEmail(user);
      res.status(201).json({ ...user.toObject(), inviteSent: true });
    } catch (mailErr) {
      console.error('Mail sending failed:', mailErr);
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

// AI endpoints (Gemini integration)
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

    const GEMINI_API_KEY = process.env.Gemini_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        system_instruction: {
          parts: [{ text: 'You are a highly experienced and empathetic Senior Sales Strategist at EarlyJobs. Your goal is to provide punchy, human-sounding sales playbooks that help Closers win deals. Avoid generic advice; be specific, creative, and professional.' }]
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      const errorMsg = errData.error?.message || 'Gemini API error';
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const strategy = data.candidates[0].content.parts[0].text;
    res.json({ strategy });
  } catch (err) {
    console.error('AI Strategy Error:', err);
    res.status(500).json({ message: err.message || 'AI Generation failed' });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    // Fetch CRM summaries context to inject into LLM
    const leads = await Lead.find({}, 'firstName lastName stage source profession investmentCapacity updatedDate').lean();
    const districts = await District.find({}, 'name status').lean();
    const franchisees = await Franchisee.find({}, 'name districtId committedAmount receivedAmount paymentStatus').lean();

    const crmData = {
      leadsTotal: leads.length,
      franchiseesTotal: franchisees.length,
      districtsTotal: districts.length,
      leads: leads,
      districts: districts,
      franchisees: franchisees
    };

    const systemPrompt = `You are the EarlyJobs CRM Insight Assistant. 
Your goal is to help users manage their franchise pipeline with clear, professional, and human-like insights.

### IDENTITY & TONE:
- Talk like a helpful, senior CRM analyst at EarlyJobs.
- Be proactive, intelligent, and professional.
- Use a friendly but business-focused tone.

### DATA SOURCE:
- You MUST answer questions using the CRM DATA provided below.
- If the information is not in the CRM DATA, clearly state that you don't have that specific information yet.
- NEVER hypothesize or "hallucinate" data (e.g., don't invent leads or districts).

### FORMATTING:
- Use Markdown for structured data.
- If listing stats, use tables or bullet points.
- Highlights important names or numbers in **bold**.

### CRM DATA:
${JSON.stringify(crmData)}

Respond directly to the user's latest query based on this context.`;

    const GEMINI_API_KEY = process.env.Gemini_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        })),
        system_instruction: {
          parts: [{ text: systemPrompt }]
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      const errorMsg = errData.error?.message || 'Gemini API error';
      throw new Error(errorMsg);
    }

    const data = await response.json();
    const reply = data.candidates[0].content.parts[0].text;
    res.json({ reply });
  } catch (err) {
    console.error('AI Chat Error:', err);
    res.status(500).json({ message: err.message || 'AI Chat failed' });
  }
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

if (process.env.NODE_ENV !== 'production') {
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
}

// Export for Vercel Serverless Function
module.exports = app;
