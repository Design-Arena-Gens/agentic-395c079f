import { computeCreativeScore, deriveInsights } from '../lib/utils.js';
import { fetchFacebookCreativeMetrics } from '../lib/facebook.js';
import { generateVariationsWithGemini } from '../lib/ai.js';

function enableCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret');
}

export default async function handler(req, res) {
  enableCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true, message: 'Webhook ready' });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const provided = req.headers['x-webhook-secret'] || req.headers['X-Webhook-Secret'];
    if (provided !== secret) return res.status(401).json({ error: 'Invalid webhook secret' });
  }

  try {
    const body = req.body || {};
    const { source = 'custom', brand = {}, numVariants = 3 } = body;

    let creativeMetrics = [];
    if (Array.isArray(body.creativeMetrics)) {
      creativeMetrics = body.creativeMetrics;
    } else if (source === 'facebook') {
      const accessToken = body?.facebook?.accessToken || process.env.FB_ACCESS_TOKEN;
      const adAccountId = body?.facebook?.adAccountId;
      const { creativeMetrics: fbMetrics } = await fetchFacebookCreativeMetrics({ accessToken, adAccountId });
      creativeMetrics = fbMetrics;
    }

    if (!creativeMetrics.length) {
      creativeMetrics = [
        { id: 'S1', headline: 'Save 30% Today', primaryText: 'Upgrade your workflow in minutes', impressions: 12000, clicks: 420, ctr: 0.035, cpc: 0.45, conversions: 38, costPerConversion: 5.2, roas: 2.4, cta: 'Shop Now' }
      ];
    }

    const withScores = creativeMetrics.map(m => ({ ...m, score: computeCreativeScore(m) }))
      .sort((a, b) => b.score - a.score);
    const { top, bottom, insights } = deriveInsights(withScores);

    const geminiKey = process.env.GEMINI_API_KEY;
    const generation = await generateVariationsWithGemini({ apiKey: geminiKey, brand, insights, numVariants });

    return res.status(200).json({
      topCreatives: top,
      bottomCreatives: bottom,
      insights: generation.insights || insights,
      variations: generation.variations || [],
      totalCreatives: withScores.length
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
