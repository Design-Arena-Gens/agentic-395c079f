export function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function computeCreativeScore(m) {
  // Weighted composite score; tune weights as needed
  const ctr = safeNumber(m.ctr);
  const cpc = safeNumber(m.cpc);
  const conversions = safeNumber(m.conversions);
  const costPerConv = safeNumber(m.costPerConversion);
  const roas = safeNumber(m.roas);
  const impressions = safeNumber(m.impressions);

  const ctrScore = ctr * 100;
  const cpcScore = cpc > 0 ? 50 / cpc : 0;
  const convScore = conversions * 5;
  const costConvScore = costPerConv > 0 ? 50 / costPerConv : 0;
  const roasScore = roas * 20;
  const impScore = Math.log10(impressions + 1) * 10;

  return ctrScore + cpcScore + convScore + costConvScore + roasScore + impScore;
}

export function deriveInsights(sortedCreatives) {
  const top = sortedCreatives.slice(0, Math.min(3, sortedCreatives.length));
  const bottom = sortedCreatives.slice(-Math.min(3, sortedCreatives.length));

  const whatWorked = [];
  const whatDidntWork = [];

  if (top.some(c => safeNumber(c.ctr) > 0.02)) whatWorked.push('Higher CTR (\u2265 2%) drove stronger engagement.');
  if (top.some(c => (c.headline||'').toLowerCase().includes('%') || (c.primaryText||'').includes('%'))) whatWorked.push('Specific numeric claims in headlines improved performance.');
  if (top.some(c => (c.cta||'').toLowerCase().includes('shop') || (c.cta||'').toLowerCase().includes('get'))) whatWorked.push('Clear action-oriented CTAs increased click-through.');
  if (top.some(c => safeNumber(c.conversions) > 0)) whatWorked.push('Direct outcome (conversions) present in top creatives.');

  if (bottom.some(c => safeNumber(c.ctr) < 0.005)) whatDidntWork.push('Very low CTR (< 0.5%) indicates weak hooks/visuals.');
  if (bottom.some(c => safeNumber(c.cpc) > 3)) whatDidntWork.push('High CPC suggests low ad relevance or weak targeting.');
  if (bottom.every(c => !c.headline && !c.primaryText)) whatDidntWork.push('Missing compelling copy (headline/primary text).');

  const guidelines = [
    'Lead with the strongest benefit in the first 5 words.',
    'Use concrete numbers and social proof where possible.',
    'Keep primary text under 130 characters for mobile truncation.',
    'Pair copy with a high-contrast product visual or clear before/after.',
    'A/B test 1 variable at a time: hook, proof, CTA.',
  ];

  return { top, bottom, insights: { whatWorked, whatDidntWork, guidelines } };
}
