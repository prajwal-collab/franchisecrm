
require('dotenv').config({ path: './server/.env' });

async function verifyGemini() {
  console.log('Testing Gemini API Connection...');
  const GEMINI_API_KEY = process.env.Gemini_API_KEY;
  console.log('API Key starts with:', GEMINI_API_KEY?.substring(0, 10));

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Say "Gemini is online" if you can hear me.' }]
        }],
        system_instruction: {
          parts: [{ text: 'You are a test assistant.' }]
        }
      })
    });

    if (!response.ok) {
      const errData = await response.json();
      console.error('Gemini API Error:', JSON.stringify(errData, null, 2));
      process.exit(1);
    }

    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Gemini Reply:', data.candidates[0].content.parts[0].text);
    console.log('✅ Gemini Integration Verified!');
  } catch (err) {
    console.error('Fetch Error:', err);
    process.exit(1);
  }
}

verifyGemini();
