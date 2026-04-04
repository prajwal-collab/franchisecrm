async function r(a){try{const e=await fetch("/api/ai/generate-strategy",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({leadDetails:a})});if(!e.ok)throw new Error("AI Generation failed");return(await e.json()).strategy}catch(e){return console.error("AI Error:",e),`### ⚠️ AI Strategy Unavailable

${e.message||"Check backend logs and API key."}`}}export{r as generateSalesStrategy};
