// ============================================================
// AI Sales Assistant Service
// ============================================================

export async function generateSalesStrategy(lead) {
  const context = localStorage.getItem('ej_ai_context') || 'EarlyJobs Franchise Sales.';
  
  // In a real implementation with a backend, this would call OpenAI/Gemini.
  // We simulate a processing delay.
  await new Promise(r => setTimeout(r, 1200));

  // Heuristic generation for demo
  const strategy = `
### 💡 Sales Strategy for ${lead.firstName}

**Status:** ${lead.stage} | **Potential:** ${lead.score > 70 ? 'High' : 'Moderate'}

#### 🎯 The Hook
Since the lead is a **${lead.profession}** with **${lead.investmentCapacity}** capacity, focus on the **low-risk, high-return** nature of EarlyJobs. Mention how their background specifically fits the franchise model.

#### 🎙️ Recommended Script (WhatsApp/Call)
"Hi ${lead.firstName}, I noticed you're exploring franchise opportunities in **${lead.districtName || 'your area'}**. Given your experience as a ${lead.profession}, you're uniquely positioned to succeed with EarlyJobs' educational franchise model. I'd love to discuss how you can manage this along with your current commitments."

#### ⚠️ Objection Handling
If they mention investment concerns: *"Our 3.5L token amount is fully deductible from the final fee, ensuring you can block your district while you review the paperwork."*

#### 📈 Next Best Action
${lead.stage === 'New Lead' ? 'Move to **Contacted** after sending the initial brochure.' : 'Schedule a **1:1 Sales Meeting** to finalize the district locking.'}
  `.trim();

  return strategy;
}
