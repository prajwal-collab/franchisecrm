
require('dotenv').config({ path: './.env' });

async function listModelNames() {
  const GEMINI_API_KEY = (process.env.Gemini_API_KEY || '').trim();
  console.log('Using API Key:', GEMINI_API_KEY.substring(0, 5) + '...');
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    if (data.models) {
      console.log('Available Models:');
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log('No models found or error:', data);
    }
  } catch (err) {
    console.error(err);
  }
}

listModelNames();
