async function n(a){try{const e=await fetch("/api/ai/generate-strategy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leadDetails:a})});if(!e.ok){const t=await e.json();throw new Error(t.message||"AI Generation failed")}return(await e.json()).strategy}catch(e){return console.error("AI Error:",e),`### ⚠️ AI Strategy Unavailable

${e.message||"Check backend logs and API key."}`}}export{n as generateSalesStrategy};
