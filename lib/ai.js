export async function generateVariationsWithGemini({ apiKey, brand, insights, numVariants = 3 }) {
  if (!apiKey) {
    // Fallback: simple deterministic variations without external API
    const baseCta = 'Learn More';
    const name = brand?.name || 'Your Brand';
    const product = brand?.product || 'your product';
    const audience = brand?.audience || '';
    const hooks = [
      'Save time today',
      'Built for results',
      'Trusted by teams'
    ];
    const variations = Array.from({ length: numVariants }).map((_, i) => ({
      headline: `${hooks[i % hooks.length]} with ${name}`,
      primaryText: `Meet ${product} ? designed for ${audience || 'busy people'} to get more done in less time.`,
      description: `Start today and see measurable impact within weeks.`,
      cta: baseCta
    }));
    return { variations, insights };
  }
  const model = 'gemini-1.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const prompt = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: `You are an expert performance ad copywriter. Analyze the provided brand context and insights and produce ${numVariants} high-converting ad copy variations. Output strictly valid JSON with the schema: {"variations":[{"headline":"","primaryText":"","description":"","cta":""}], "insights":{"whatWorked":[],"whatDidntWork":[],"guidelines":[]}}. Avoid any extra commentary.`
      },
      { type: 'text', text: `Brand: ${brand?.name || ''}` },
      { type: 'text', text: `Voice: ${brand?.voice || ''}` },
      { type: 'text', text: `Audience: ${brand?.audience || ''}` },
      { type: 'text', text: `Product: ${brand?.product || ''}` },
      { type: 'text', text: `Insights: ${JSON.stringify(insights)}` },
    ]
  };

  const body = {
    contents: [prompt],
    generationConfig: {
      temperature: 0.7,
      topP: 0.9,
      maxOutputTokens: 800,
      response_mime_type: 'application/json'
    }
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error: ${res.status} ${text}`);
  }
  const data = await res.json();
  // Gemini returns candidates[0].content.parts[0].text
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  let parsed;
  try { parsed = JSON.parse(text); } catch { parsed = { variations: [] }; }
  if (!Array.isArray(parsed.variations)) parsed.variations = [];
  // Coerce to 3 variants
  parsed.variations = parsed.variations.slice(0, numVariants);
  return parsed;
}
