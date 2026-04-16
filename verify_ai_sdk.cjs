require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function verifyAI() {
  const key = process.env.Gemini_API_KEY;
  if (!key) {
    console.error('ERROR: Gemini_API_KEY missing in .env');
    process.exit(1);
  }

  const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  console.log(`Testing Gemini SDK with model: ${modelName}...`);
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent("Say 'AI is working' if you can read this.");
    const response = await result.response;
    const text = response.text();
    
    console.log('SUCCESS: Gemini Response:', text);
  } catch (err) {
    console.error('FAILURE: Gemini SDK Error:', err.message);
  }
}

verifyAI();
