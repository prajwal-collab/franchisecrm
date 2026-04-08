// Using global fetch (Node 18+)

async function testAI() {
  try {
    const response = await fetch('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello, how many leads are there?' }]
      })
    });
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

testAI();
