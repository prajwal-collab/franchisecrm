
require('dotenv').config({ path: './server/.env' });

async function listModels() {
  const GEMINI_API_KEY = process.env.Gemini_API_KEY;
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

listModels();
