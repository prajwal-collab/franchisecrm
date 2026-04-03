async function o(e){return localStorage.getItem("ej_ai_context"),await new Promise(t=>setTimeout(t,1200)),`
### 💡 Sales Strategy for ${e.firstName}

**Status:** ${e.stage} | **Potential:** ${e.score>70?"High":"Moderate"}

#### 🎯 The Hook
Since the lead is a **${e.profession}** with **${e.investmentCapacity}** capacity, focus on the **low-risk, high-return** nature of EarlyJobs. Mention how their background specifically fits the franchise model.

#### 🎙️ Recommended Script (WhatsApp/Call)
"Hi ${e.firstName}, I noticed you're exploring franchise opportunities in **${e.districtName||"your area"}**. Given your experience as a ${e.profession}, you're uniquely positioned to succeed with EarlyJobs' educational franchise model. I'd love to discuss how you can manage this along with your current commitments."

#### ⚠️ Objection Handling
If they mention investment concerns: *"Our 3.5L token amount is fully deductible from the final fee, ensuring you can block your district while you review the paperwork."*

#### 📈 Next Best Action
${e.stage==="New Lead"?"Move to **Contacted** after sending the initial brochure.":"Schedule a **1:1 Sales Meeting** to finalize the district locking."}
  `.trim()}export{o as generateSalesStrategy};
