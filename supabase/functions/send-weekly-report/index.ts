import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BrandSummary {
  name: string;
  currentScore: number;
  previousScore: number;
  mentions: number;
  trend: "up" | "down" | "stable";
}

interface EmailRequest {
  userEmail: string;
  userName?: string;
  brands: BrandSummary[];
  totalMentions: number;
  weekRange: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName, brands, totalMentions, weekRange }: EmailRequest = await req.json();

    console.log(`[SEND-WEEKLY-REPORT] Sending report to ${userEmail}`);

    // Gerar HTML do relatório
    const brandRows = brands.map((brand) => {
      const trendIcon = brand.trend === "up" ? "📈" : brand.trend === "down" ? "📉" : "➡️";
      const trendColor = brand.trend === "up" ? "#10b981" : brand.trend === "down" ? "#ef4444" : "#6b7280";
      
      return `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 16px; font-weight: 500;">${brand.name}</td>
          <td style="padding: 16px; text-align: center;">
            <span style="color: ${trendColor}; font-size: 20px;">${trendIcon}</span>
          </td>
          <td style="padding: 16px; text-align: center; font-weight: 600; color: #6366f1;">
            ${brand.currentScore.toFixed(1)}
          </td>
          <td style="padding: 16px; text-align: center; color: #6b7280;">
            ${brand.previousScore.toFixed(1)}
          </td>
          <td style="padding: 16px; text-align: center; font-weight: 500;">
            ${brand.mentions}
          </td>
        </tr>
      `;
    }).join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            
            <!-- Header -->
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">
                📊 Relatório Diário GEO
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">
                ${weekRange}
              </p>
            </div>

            <!-- Greeting -->
            <div style="padding: 32px 24px 16px 24px;">
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px; line-height: 1.5;">
                Olá ${userName || 'Usuário'},
              </p>
              <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.5;">
                Aqui está seu relatório diário de performance das suas marcas no GEO-Cognition.
              </p>
            </div>

            <!-- Summary Stats -->
            <div style="padding: 0 24px 24px 24px;">
              <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; display: flex; justify-content: space-around;">
                <div style="text-align: center;">
                  <div style="font-size: 32px; font-weight: 700; color: #6366f1;">${brands.length}</div>
                  <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Marcas</div>
                </div>
                <div style="text-align: center;">
                  <div style="font-size: 32px; font-weight: 700; color: #6366f1;">${totalMentions}</div>
                  <div style="font-size: 14px; color: #6b7280; margin-top: 4px;">Menções</div>
                </div>
              </div>
            </div>

            <!-- Brands Table -->
            <div style="padding: 0 24px 32px 24px;">
              <h2 style="color: #111827; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
                Desempenho por Marca
              </h2>
              <table style="width: 100%; border-collapse: collapse; background-color: white; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
                    <th style="padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Marca</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Tendência</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Score Atual</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Score Anterior</th>
                    <th style="padding: 12px 16px; text-align: center; font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase;">Menções</th>
                  </tr>
                </thead>
                <tbody>
                  ${brandRows}
                </tbody>
              </table>
            </div>

            <!-- CTA -->
            <div style="padding: 0 24px 32px 24px; text-align: center;">
              <a href="https://geo-cognition.lovable.app/insights" 
                 style="display: inline-block; background-color: #6366f1; color: white; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                Ver Relatório Completo
              </a>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
                Gerado automaticamente pela plataforma GEO-Cognition
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                Você está recebendo este email porque configurou relatórios automáticos
              </p>
            </div>

          </div>
        </body>
      </html>
    `;

    // Enviar email usando API do Resend diretamente
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "GEO-Cognition <onboarding@resend.dev>",
        to: [userEmail],
        subject: `📊 Relatório Diário GEO - ${weekRange}`,
        html,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(emailData)}`);
    }

    console.log(`[SEND-WEEKLY-REPORT] Email sent successfully to ${userEmail}:`, emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: emailData.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("[SEND-WEEKLY-REPORT] Error sending email:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
});
