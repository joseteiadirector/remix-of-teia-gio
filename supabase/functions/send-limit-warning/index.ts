import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LimitWarningRequest {
  userEmail: string;
  limitType: "brands" | "analyses";
  currentUsage: number;
  limit: number;
  planName: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, limitType, currentUsage, limit, planName }: LimitWarningRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("[LIMIT-WARNING] Sending to:", userEmail, "Type:", limitType);

    const limitLabels = {
      brands: "marcas monitoradas",
      analyses: "análises mensais"
    };

    const percentage = (currentUsage / limit) * 100;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background-color: #f59e0b; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">⚠️ Aviso de Limite</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Você está próximo do limite do seu plano <strong>${planName}</strong>.
            </p>
            
            <div style="background-color: #fef3c7; padding: 25px; margin: 20px 0; border-radius: 8px; border: 2px solid #f59e0b;">
              <div style="margin-bottom: 15px;">
                <span style="color: #78350f; font-size: 14px; font-weight: 600; text-transform: uppercase;">
                  ${limitLabels[limitType]}
                </span>
              </div>
              
              <div style="background-color: #fffbeb; border-radius: 8px; height: 30px; overflow: hidden; margin-bottom: 15px;">
                <div style="background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); height: 100%; width: ${percentage}%; display: flex; align-items: center; justify-content: center;">
                  <span style="color: #ffffff; font-size: 12px; font-weight: 700;">${percentage.toFixed(0)}%</span>
                </div>
              </div>
              
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="color: #78350f; font-size: 14px;">
                  <strong>${currentUsage}</strong> de <strong>${limit}</strong> utilizados
                </span>
                <span style="color: #d97706; font-size: 14px; font-weight: 600;">
                  ${limit - currentUsage} restantes
                </span>
              </div>
            </div>
            
            ${percentage >= 100 ? `
            <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p style="color: #991b1b; font-size: 14px; margin: 0; line-height: 1.6;">
                🚫 <strong>Limite atingido!</strong> Você não poderá adicionar mais ${limitLabels[limitType]} até fazer upgrade do seu plano.
              </p>
            </div>
            ` : `
            <div style="background-color: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 8px;">
              <p style="color: #1e40af; font-size: 14px; margin: 0; line-height: 1.6;">
                💡 <strong>Dica:</strong> Faça upgrade para continuar aproveitando todos os recursos sem interrupções!
              </p>
            </div>
            `}
          </div>
          
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Você está recebendo este aviso porque atingiu ${percentage.toFixed(0)}% do limite do seu plano.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Teia Studio GEO <notifications@resend.dev>",
        to: [userEmail],
        subject: `⚠️ Você atingiu ${percentage.toFixed(0)}% do seu limite`,
        html: emailHtml,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[LIMIT-WARNING] Resend error:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log("[LIMIT-WARNING] Email sent successfully");

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[LIMIT-WARNING] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
