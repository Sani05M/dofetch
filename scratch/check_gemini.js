const GEMINI_API_KEY = "AIzaSyAQXzPSnuzaJvxkFYCtolhGJM4QETHK8ZI";

async function listModels() {
  console.log("--- Checking v1beta ---");
  const r1 = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`);
  const d1 = await r1.json();
  if (d1.models) {
    const generating = d1.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    console.log("generateContent models (v1beta):");
    generating.forEach(m => console.log(" -", m.name));
  } else {
    console.log("v1beta error:", JSON.stringify(d1));
  }

  console.log("\n--- Checking v1 ---");
  const r2 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${GEMINI_API_KEY}`);
  const d2 = await r2.json();
  if (d2.models) {
    const generating = d2.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
    console.log("generateContent models (v1):");
    generating.forEach(m => console.log(" -", m.name));
  } else {
    console.log("v1 error:", JSON.stringify(d2));
  }
}

listModels().catch(console.error);
