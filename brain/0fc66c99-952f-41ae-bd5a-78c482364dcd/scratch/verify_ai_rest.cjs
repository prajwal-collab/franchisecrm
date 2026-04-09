require('dotenv').config();

async function testAI() {
  const apiKey = (process.env.Gemini_API_KEY || '').trim();
  if (!apiKey) {
    console.error('Gemini_API_KEY missing');
    return;
  }

  // Using gemini-2.0-flash which was in the list
  const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: 'Say hello in one word.' }]
      }]
    })
  });

  if (!response.ok) {
    const err = await response.json();
    console.error('AI Error:', JSON.stringify(err, null, 2));
  } else {
    const data = await response.json();
    console.log('AI Success:', data.candidates[0].content.parts[0].text);
  }
}

testAI();
