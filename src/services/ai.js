// ============================================================
// AI Sales Assistant Service
// ============================================================

export async function generateSalesStrategy(lead) {
  try {
    const res = await fetch('/api/ai/generate-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadDetails: lead })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.message || 'AI Generation failed');
    }
    const data = await res.json();
    return data.strategy;
  } catch (err) {
    console.error('AI Error:', err);
    return `### ⚠️ AI Strategy Unavailable\n\n${err.message || 'Check backend logs and API key.'}`;
  }
}
