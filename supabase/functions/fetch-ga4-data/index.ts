import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('📊 Fetching Google Analytics 4 data...');

  try {
    const { brandId, startDate, endDate } = await req.json();
    
    if (!brandId) {
      throw new Error('brandId is required');
    }

    const ga4PropertyId = Deno.env.get('GA4_PROPERTY_ID');
    const gscCredentialsJson = Deno.env.get('GSC_CREDENTIALS_JSON');
    
    if (!ga4PropertyId || !gscCredentialsJson) {
      throw new Error('GA4_PROPERTY_ID or GSC_CREDENTIALS_JSON not configured');
    }

    const credentials = JSON.parse(gscCredentialsJson);
    
    // Check if it's a Service Account (has private_key and client_email)
    if (!credentials.private_key || !credentials.client_email) {
      console.error('❌ Invalid Service Account JSON. Keys found:', Object.keys(credentials));
      throw new Error('GSC_CREDENTIALS_JSON must be a valid Service Account JSON with private_key and client_email');
    }

    console.log('🔐 Creating JWT for Service Account:', credentials.client_email);

    // Create JWT for Service Account authentication
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const jwtClaim = {
      iss: credentials.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    };

    // Encode JWT
    const encoder = new TextEncoder();
    const headerBase64 = btoa(JSON.stringify(jwtHeader)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const claimBase64 = btoa(JSON.stringify(jwtClaim)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const unsignedToken = `${headerBase64}.${claimBase64}`;

    // Import private key - ensure proper PEM format
    console.log('🔐 Processing private key...');
    
    let privateKeyPem = credentials.private_key;
    
    // If the key doesn't have proper line breaks, add them
    if (!privateKeyPem.includes('\n')) {
      privateKeyPem = privateKeyPem.replace(/\\n/g, '\n');
    }
    
    // Ensure proper PEM format
    if (!privateKeyPem.startsWith('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid private key format: missing PEM header');
    }
    
    console.log('🔐 Private key has proper PEM format');
    
    // Remove PEM headers and extract base64 content
    const pemContents = privateKeyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    // Convert base64 to binary
    const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
    
    console.log('🔐 Importing key...');
    const key = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    // Sign JWT
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      key,
      encoder.encode(unsignedToken)
    );

    const signatureBase64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    
    const jwt = `${unsignedToken}.${signatureBase64}`;

    console.log('🔐 Exchanging JWT for access token...');

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('❌ Token exchange error:', error);
      throw new Error(`Failed to exchange JWT for access token: ${error}`);
    }

    const { access_token } = await tokenResponse.json();
    console.log('✅ Access token obtained');

    // Default to last 7 days
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`📅 Querying GA4 property ${ga4PropertyId} from ${start} to ${end}`);

    // Query Google Analytics 4 Data API
    const ga4Response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: start, endDate: end }],
          dimensions: [
            { name: 'pagePath' },
            { name: 'pageTitle' }
          ],
          metrics: [
            { name: 'screenPageViews' },
            { name: 'sessions' },
            { name: 'engagementRate' },
            { name: 'bounceRate' }
          ],
          limit: 100,
          orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }]
        }),
      }
    );

    if (!ga4Response.ok) {
      const error = await ga4Response.text();
      console.error('❌ GA4 API error:', error);
      throw new Error(`GA4 API failed: ${error}`);
    }

    const ga4Data = await ga4Response.json();
    console.log(`✅ Found ${ga4Data.rows?.length || 0} pages`);

    const analyticsData = (ga4Data.rows || []).map((row: any) => ({
      pagePath: row.dimensionValues[0].value,
      pageTitle: row.dimensionValues[1].value,
      pageViews: parseInt(row.metricValues[0].value),
      sessions: parseInt(row.metricValues[1].value),
      engagementRate: parseFloat(row.metricValues[2].value),
      bounceRate: parseFloat(row.metricValues[3].value),
    }));

    // Store analytics data in database using direct HTTP call
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      // Store total metrics for the brand
      const totalPageViews = analyticsData.reduce((sum: number, item: any) => sum + item.pageViews, 0);
      const totalSessions = analyticsData.reduce((sum: number, item: any) => sum + item.sessions, 0);
      const avgEngagementRate = analyticsData.reduce((sum: number, item: any) => sum + item.engagementRate, 0) / analyticsData.length;
      const avgBounceRate = analyticsData.reduce((sum: number, item: any) => sum + item.bounceRate, 0) / analyticsData.length;
      
      await fetch(`${supabaseUrl}/rest/v1/signals`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          brand_id: brandId,
          kind: 'analytics',
          metric: 'page_views',
          value: totalPageViews,
          meta: { 
            sessions: totalSessions,
            engagement_rate: avgEngagementRate,
            bounce_rate: avgBounceRate,
            period: `${start}_to_${end}`
          },
          collected_at: new Date().toISOString(),
        }),
      });
      
      console.log('💾 Analytics data stored in database');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: analyticsData,
      summary: {
        totalPageViews: analyticsData.reduce((sum: number, item: any) => sum + item.pageViews, 0),
        totalSessions: analyticsData.reduce((sum: number, item: any) => sum + item.sessions, 0),
        avgEngagementRate: analyticsData.reduce((sum: number, item: any) => sum + item.engagementRate, 0) / analyticsData.length,
        avgBounceRate: analyticsData.reduce((sum: number, item: any) => sum + item.bounceRate, 0) / analyticsData.length,
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
