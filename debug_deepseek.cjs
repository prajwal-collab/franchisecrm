
// Node 22 has built-in fetch.
require('dotenv').config({ path: './server/.env' });

async function testDeepSeek() {
  console.log('Testing DeepSeek API Connection...');
  console.log('API Key starts with:', process.env.DEEPSEEK_API_KEY?.substring(0, 10));

  const systemPrompt = "You are a test assistant.";
  const messages = [{ role: 'user', content: 'Say hello' }];

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        stream: false
      })
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);

    const data = await response.text();
    console.log('Response Body:', data);

    try {
      const jsonData = JSON.parse(data);
      console.log('Parsed JSON:', JSON.stringify(jsonData, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }

  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testDeepSeek();
