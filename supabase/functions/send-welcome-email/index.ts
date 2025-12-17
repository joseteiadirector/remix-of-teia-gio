import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  userEmail: string;
  userName?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userEmail, userName }: WelcomeEmailRequest = await req.json();
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY not configured");
    }

    console.log("[WELCOME-EMAIL] Sending to:", userEmail);

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%); padding: 40px 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Bem-vindo ao Teia Studio GEO! 🎉</h1>
          </div>
          
          <div style="padding: 40px 30px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Olá${userName ? ` ${userName}` : ''}! 👋
            </p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Estamos muito felizes em ter você conosco! Você agora tem acesso à plataforma mais avançada de monitoramento de presença em LLMs e análise de SEO otimizado para IA.
            </p>
            
            <div style="background-color: #f8f9fa; border-left: 4px solid #8B5CF6; padding: 20px; margin: 30px 0; border-radius: 8px;">
              <h2 style="color: #333333; font-size: 18px; margin: 0 0 15px 0; font-weight: 600;">🚀 Primeiros Passos</h2>
              <ul style="color: #555555; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li>Adicione suas primeiras marcas para monitorar</li>
                <li>Configure análises de URLs para otimização de conteúdo</li>
                <li>Explore o dashboard com métricas em tempo real</li>
                <li>Receba alertas sobre mudanças importantes</li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 8px;">
              <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.6;">
                💡 <strong>Dica:</strong> Você está no plano gratuito. Faça upgrade para desbloquear análises ilimitadas e recursos avançados!
              </p>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 13px; margin: 0 0 10px 0;">
              © ${new Date().getFullYear()} Teia Studio GEO. Todos os direitos reservados.
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
        from: "Teia Studio GEO <onboarding@resend.dev>",
        to: [userEmail],
        subject: "Bem-vindo ao Teia Studio GEO! 🚀",
        html: emailHtml,
      }),
    });

    const responseData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("[WELCOME-EMAIL] Resend error:", responseData);
      throw new Error(responseData.message || "Failed to send email");
    }

    console.log("[WELCOME-EMAIL] Email sent successfully:", responseData);

    return new Response(JSON.stringify({ success: true, data: responseData }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[WELCOME-EMAIL] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
