import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { chartIds, appUrl } = await req.json();
    
    if (!chartIds || !Array.isArray(chartIds)) {
      return new Response(
        JSON.stringify({ error: 'chartIds array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📸 Iniciando captura de gráficos no backend:', { chartIds, appUrl });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Navega para a página com os gráficos
    await page.goto(appUrl || 'https://your-app-url.com/scores', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Aguarda renderização completa
    await page.waitForTimeout(3000);

    const captures: { id: string; dataUrl: string | null }[] = [];

    // Captura cada gráfico
    for (const chartId of chartIds) {
      try {
        console.log(`Capturando gráfico: ${chartId}`);
        
        const element = await page.$(`#${chartId}`);
        
        if (!element) {
          console.warn(`❌ Gráfico não encontrado: ${chartId}`);
          captures.push({ id: chartId, dataUrl: null });
          continue;
        }

        // Captura screenshot do elemento
        const screenshot = await element.screenshot({
          type: 'png',
          omitBackground: false,
        });

        // Converte para base64
        const base64 = btoa(String.fromCharCode(...new Uint8Array(screenshot)));
        const dataUrl = `data:image/png;base64,${base64}`;

        console.log(`✅ Gráfico capturado: ${chartId} (${dataUrl.length} bytes)`);
        
        captures.push({ id: chartId, dataUrl });
      } catch (error) {
        console.error(`Erro ao capturar ${chartId}:`, error);
        captures.push({ id: chartId, dataUrl: null });
      }
    }

    await browser.close();

    const successCount = captures.filter(c => c.dataUrl !== null).length;
    console.log(`✅ Captura concluída: ${successCount}/${chartIds.length} gráficos`);

    return new Response(
      JSON.stringify({ 
        success: true,
        captures,
        stats: {
          total: chartIds.length,
          captured: successCount,
          failed: chartIds.length - successCount
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Erro fatal na captura:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao capturar gráficos',
        details: errorMessage
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
