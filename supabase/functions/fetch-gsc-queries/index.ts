import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GSCQuery {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('🔍 Fetching Google Search Console queries...');

  try {
    // Get the raw body text first
    const bodyText = await req.text();
    console.log('📥 Raw request body:', bodyText);
    console.log('📥 Body length:', bodyText.length);
    console.log('📥 Body type:', typeof bodyText);

    // Try to parse the body
    let body: any = {};
    if (bodyText && bodyText.trim().length > 0) {
      try {
        body = JSON.parse(bodyText);
        console.log('✅ Parsed body:', JSON.stringify(body, null, 2));
      } catch (parseError) {
        console.error('❌ JSON parse error:', parseError);
        console.error('❌ Failed to parse:', bodyText.substring(0, 100));
        return new Response(JSON.stringify({ 
          error: 'Invalid JSON in request body',
          details: parseError instanceof Error ? parseError.message : 'Unknown error',
          received: bodyText.substring(0, 100)
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { brandId, domain, startDate, endDate } = body;
    
    if (!brandId || !domain) {
      throw new Error('brandId and domain are required');
    }

    const gscCredentialsJson = Deno.env.get('GSC_CREDENTIALS_JSON');
    
    if (!gscCredentialsJson) {
      throw new Error('GSC_CREDENTIALS_JSON not configured');
    }

    console.log('🔐 GSC credentials found, length:', gscCredentialsJson.length);
    console.log('🔐 First 50 chars:', gscCredentialsJson.substring(0, 50));
    console.log('🔐 Last 50 chars:', gscCredentialsJson.substring(gscCredentialsJson.length - 50));

    let credentials;
    try {
      // Remove any potential BOM or extra whitespace
      const cleanJson = gscCredentialsJson.trim().replace(/^\uFEFF/, '');
      credentials = JSON.parse(cleanJson);
      console.log('✅ Credentials parsed successfully');
      console.log('🔑 Keys found:', Object.keys(credentials).join(', '));
    } catch (parseError) {
      console.error('❌ Failed to parse GSC_CREDENTIALS_JSON');
      console.error('❌ Parse error:', parseError);
      console.error('❌ JSON preview (first 200 chars):', gscCredentialsJson.substring(0, 200));
      throw new Error(`Invalid GSC_CREDENTIALS_JSON format: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
    
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
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
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
    
    // Clean and format the private key
    let privateKeyPem = credentials.private_key;
    
    // If the key doesn't have proper line breaks, add them
    if (!privateKeyPem.includes('\n')) {
      // Replace escaped newlines with actual newlines
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

    // Extract hostname from domain URL
    let hostname = domain;
    let urlPrefix = domain;
    try {
      // Try to parse as URL
      const url = new URL(domain.startsWith('http') ? domain : `https://${domain}`);
      hostname = url.hostname;
      urlPrefix = `${url.protocol}//${url.hostname}/`;
    } catch {
      // If not a valid URL, clean it manually
      hostname = domain.replace(/^https?:\/\//, '').split('/')[0].replace(/\/$/, '');
      urlPrefix = `https://${hostname}/`;
    }
    
    // Remove www from domain property format
    const domainWithoutWww = hostname.replace(/^www\./, '');
    
    console.log(`🌐 Extracted hostname: ${hostname} from domain: ${domain}`);
    console.log(`🌐 Will try: sc-domain:${domainWithoutWww} and ${urlPrefix}`);

    // Default to last 7 days if dates not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Helper function to query GSC
    const queryGSC = async (siteUrl: string) => {
      console.log(`📅 Querying GSC for ${siteUrl} from ${start} to ${end}`);
      
      return await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            startDate: start,
            endDate: end,
            dimensions: ['query'],
            rowLimit: 100
            // Removido filtro incorreto - agora busca todas as queries do domínio
          }),
        }
      );
    };

    // Try Domain property first (without www)
    let gscResponse = await queryGSC(`sc-domain:${domainWithoutWww}`);
    
    // If 403/404, try URL prefix with original hostname
    if (!gscResponse.ok && (gscResponse.status === 403 || gscResponse.status === 404)) {
      console.log(`⚠️ Domain property failed, trying URL prefix: ${urlPrefix}`);
      gscResponse = await queryGSC(urlPrefix);
    }

    if (!gscResponse.ok) {
      const error = await gscResponse.text();
      console.error('❌ GSC API error:', error);
      
      try {
        const errorData = JSON.parse(error);
        const errorMessage = errorData.error?.message || error;
        
        if (gscResponse.status === 403) {
          throw new Error(`Sem permissão de acesso ao Search Console. Verifique se a conta de serviço ${credentials.client_email} foi adicionada como usuário no Google Search Console para: sc-domain:${domainWithoutWww} ou ${urlPrefix}. Pode levar alguns minutos para as permissões propagarem.`);
        } else if (gscResponse.status === 400) {
          throw new Error(`Domínio não encontrado no Search Console. Configure: sc-domain:${domainWithoutWww} ou ${urlPrefix}`);
        }
        
        throw new Error(`Erro da API do GSC: ${errorMessage}`);
      } catch (parseError) {
        throw new Error(`Erro da API do GSC: ${error}`);
      }
    }

    const gscData = await gscResponse.json();
    console.log(`✅ Found ${gscData.rows?.length || 0} queries`);

    const queries: GSCQuery[] = (gscData.rows || []).map((row: any) => ({
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
    }));

    // Store queries in database using direct HTTP call
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (supabaseUrl && supabaseKey) {
      // Store queries for this brand
      for (const query of queries) {
        await fetch(`${supabaseUrl}/rest/v1/gsc_queries`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify({
            brand_id: brandId,
            query: query.query,
            clicks: query.clicks,
            impressions: query.impressions,
            ctr: query.ctr,
            position: query.position,
            collected_at: new Date().toISOString(),
          }),
        });
      }
      
      console.log('💾 Queries stored in database');
      
      // Log audit trail for security compliance
      try {
        const auditResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/log_gsc_operation`, {
          method: 'POST',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            _operation: 'INSERT',
            _brand_id: brandId,
            _edge_function: 'fetch-gsc-queries',
            _metadata: {
              queries_count: queries.length,
              date_range: { start, end },
              domain: hostname,
              timestamp: new Date().toISOString()
            }
          }),
        });
        
        if (auditResponse.ok) {
          console.log('🔒 Audit log created successfully');
        } else {
          console.warn('⚠️ Failed to create audit log:', await auditResponse.text());
        }
      } catch (auditError) {
        console.error('❌ Error creating audit log:', auditError);
        // Don't fail the main operation if audit logging fails
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      queries,
      count: queries.length 
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
