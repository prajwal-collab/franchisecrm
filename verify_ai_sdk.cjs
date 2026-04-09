require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function verifyAI() {
  const key = process.env.Gemini_API_KEY;
  if (!key) {
    console.error('ERROR: Gemini_API_KEY missing in .env');
    process.exit(1);
  }

  console.log('Testing Gemini SDK with model: gemini-2.0-flash...');
  
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const result = await model.generateContent("Say 'AI is working' if you can read this.");
    const response = await result.response;
    const text = response.text();
    
    console.log('SUCCESS: Gemini Response:', text);
  } catch (err) {
    console.error('FAILURE: Gemini SDK Error:', err.message);
    if (err.message.includes('404')) {
        console.log('Attempting fallback to gemini-1.5-flash...');
        try {
            const genAI = new GoogleGenerativeAI(key);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const result = await model.generateContent("Fallback test.");
            const response = await result.response;
            console.log('SUCCESS: Fallback working.');
        } catch (inner) {
            console.error('FAILURE: Fallback also failed:', inner.message);
        }
    }
  }
}

verifyAI();
