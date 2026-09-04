import fs from "node:fs";

const file = "index.html";
let html = fs.readFileSync(file, "utf8");

html = html.replace(
  '"https://YOUR-BAIDNET-BACKEND.vercel.app/api/baidnet-ai"',
  '"/api/baidnet-ai"'
);

html = html.replace(
`    if(!AI_API_ENDPOINT || AI_API_ENDPOINT.includes("YOUR-BAIDNET-BACKEND")){
      const demo="BAIDNET Intelligence is ready, but the secure backend URL has not been set on this deployment. Configure the backend endpoint to connect the live knowledge base.";
      addAiMessage("assistant",demo,"Knowledge layer ready • backend URL pending");
      speakText(demo);
      aiStatus.textContent="Backend URL not configured";
      return;
    }

`,
  ""
);

fs.writeFileSync(file, html);
console.log("BAIDNET Investor AI wired to same-origin /api/baidnet-ai");
