const FB_API = 'https://graph.facebook.com/v19.0';

export async function fetchFacebookCreativeMetrics({ accessToken, adAccountId, datePreset = 'last_30d', limit = 200 }) {
  if (!accessToken || !adAccountId) {
    return { creativeMetrics: [], note: 'Missing accessToken or adAccountId; returning empty results' };
  }

  // Normalize account ID
  const acct = adAccountId.replace(/^act_/, 'act_');

  const url = new URL(`${FB_API}/${acct}/ads`);
  url.searchParams.set('fields', [
    'id',
    'name',
    'creative{body,title,object_story_spec,image_url,thumbnail_url}',
    'insights.date_preset(' + datePreset + '){impressions,clicks,ctr,cpc,actions,spend}'
  ].join(','));
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('access_token', accessToken);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Facebook API error: ${res.status} ${text}`);
  }
  const json = await res.json();
  const ads = json.data || [];

  const metrics = ads.map(ad => {
    const creative = ad.creative || {};
    const insights = (ad.insights && ad.insights.data && ad.insights.data[0]) || {};
    const actions = insights.actions || [];
    const purchases = actions.find(a => a.action_type === 'purchase');
    const conversions = purchases ? Number(purchases.value || purchases.value === 0 ? purchases.value : purchases) : 0;

    return {
      id: ad.id,
      name: ad.name,
      headline: creative.title || '',
      primaryText: creative.body || '',
      description: '',
      cta: '',
      imageUrl: creative.image_url || creative.thumbnail_url || '',
      impressions: Number(insights.impressions || 0),
      clicks: Number(insights.clicks || 0),
      ctr: Number(insights.ctr || 0) / 100, // FB returns percent
      cpc: Number(insights.cpc || 0),
      conversions: Number(conversions || 0),
      costPerConversion: 0,
      roas: 0
    };
  });

  return { creativeMetrics: metrics };
}
