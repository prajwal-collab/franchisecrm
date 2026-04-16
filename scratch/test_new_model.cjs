
require('dotenv').config({ path: './.env' });

async function testModel() {
  const GEMINI_API_KEY = (process.env.Gemini_API_KEY || '').trim();
  const model = 'gemini-1.5-flash'; // Original failing one
  const modelNew = 'gemini-2.0-flash'; // Test replacement
  
  console.log('Testing with model:', modelNew);
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelNew}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Hello, are you working?' }] }]
      })
    });
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

testModel();
