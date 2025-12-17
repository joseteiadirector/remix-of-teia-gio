import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AlertNotificationRequest {
  userEmail: string;
  userName?: string;
  alertType: 'score_decrease' | 'score_increase' | 'new_mention' | 'threshold_alert';
  brandName: string;
  currentScore?: number;
  previousScore?: number;
  scoreDifference?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      userEmail,
      userName,
      alertType,
      brandName,
      currentScore,
      previousScore,
      scoreDifference,
      priority,
      message,
      metadata
    }: AlertNotificationRequest = await req.json();

    console.log(`[ALERT-NOTIFICATION] Enviando alerta para ${userEmail}`, {
      alertType,
      brandName,
      priority
    });

    // Determinar ícone e cor baseado no tipo de alerta
    const alertConfig = {
      score_decrease: {
        icon: '📉',
        color: '#ef4444',
        title: '⚠️ Alerta: Queda no Score GEO',
        emoji: '🔻'
      },
      score_increase: {
        icon: '📈',
        color: '#22c55e',
        title: '✅ Boa Notícia: Aumento no Score GEO',
        emoji: '🔺'
      },
      new_mention: {
        icon: '💬',
        color: '#3b82f6',
        title: '🔔 Nova Menção Detectada',
        emoji: '💬'
      },
      threshold_alert: {
        icon: '🎯',
        color: '#f59e0b',
        title: '🎯 Limite de Threshold Atingido',
        emoji: '⚡'
      }
    };

    const config = alertConfig[alertType];
    const priorityColors = {
      low: '#6b7280',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };

    const priorityLabels = {
      low: 'Baixa',
      medium: 'Média',
      high: 'Alta',
      critical: 'Crítica'
    };

    // Template HTML profissional
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${config.title}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
          }
          .header {
            background: linear-gradient(135deg, ${config.color} 0%, ${config.color}dd 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
          }
          .header-icon {
            font-size: 48px;
            margin-bottom: 10px;
          }
          .header-title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: white;
          }
          .content {
            padding: 40px 30px;
          }
          .alert-card {
            background-color: #f9fafb;
            border-left: 4px solid ${config.color};
            padding: 20px;
            margin-bottom: 25px;
            border-radius: 8px;
          }
          .brand-name {
            font-size: 20px;
            font-weight: bold;
            color: #111827;
            margin-bottom: 10px;
          }
          .message {
            font-size: 16px;
            color: #374151;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .score-comparison {
            display: flex;
            justify-content: space-around;
            margin: 20px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          }
          .score-box {
            text-align: center;
            flex: 1;
          }
          .score-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
          }
          .score-value {
            font-size: 32px;
            font-weight: bold;
            color: #111827;
          }
          .score-arrow {
            font-size: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: ${config.color};
          }
          .priority-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            background-color: ${priorityColors[priority]};
            color: white;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .cta-button {
            display: inline-block;
            padding: 14px 30px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            font-size: 16px;
          }
          .footer {
            background-color: #f9fafb;
            padding: 30px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
          }
          .footer-logo {
            font-size: 20px;
            font-weight: bold;
            color: #6366f1;
            margin-bottom: 10px;
          }
          .metadata-section {
            margin-top: 20px;
            padding: 15px;
            background: #fefce8;
            border-radius: 8px;
            border: 1px solid #fde047;
          }
          .metadata-title {
            font-size: 14px;
            font-weight: bold;
            color: #854d0e;
            margin-bottom: 10px;
          }
          .metadata-item {
            font-size: 13px;
            color: #713f12;
            margin: 5px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Header -->
          <div class="header">
            <div class="header-icon">${config.icon}</div>
            <h1 class="header-title">${config.title}</h1>
          </div>

          <!-- Content -->
          <div class="content">
            <div class="alert-card">
              <div class="brand-name">${config.emoji} ${brandName}</div>
              <div style="margin-bottom: 15px;">
                <span class="priority-badge">Prioridade: ${priorityLabels[priority]}</span>
              </div>
              <div class="message">${message}</div>

              ${currentScore !== undefined && previousScore !== undefined ? `
              <div class="score-comparison">
                <div class="score-box">
                  <div class="score-label">Score Anterior</div>
                  <div class="score-value">${previousScore.toFixed(1)}</div>
                </div>
                <div class="score-arrow">${alertType === 'score_decrease' ? '→' : '→'}</div>
                <div class="score-box">
                  <div class="score-label">Score Atual</div>
                  <div class="score-value" style="color: ${config.color};">${currentScore.toFixed(1)}</div>
                </div>
              </div>
              ${scoreDifference !== undefined ? `
              <div style="text-align: center; margin-top: 15px;">
                <span style="font-size: 18px; font-weight: bold; color: ${config.color};">
                  ${alertType === 'score_decrease' ? '↓' : '↑'} ${Math.abs(scoreDifference).toFixed(1)} pontos
                </span>
              </div>
              ` : ''}
              ` : ''}
            </div>

            <div style="text-align: center;">
              <a href="${Deno.env.get('APP_URL') || 'https://id-preview--a1c06a98-7d12-40f5-885f-0199526950ab.lovable.app'}/dashboard" class="cta-button">
                🚀 Ver Dashboard Completo
              </a>
            </div>

            ${metadata ? `
            <div class="metadata-section">
              <div class="metadata-title">ℹ️ Informações Adicionais</div>
              ${Object.entries(metadata).map(([key, value]) => `
                <div class="metadata-item"><strong>${key}:</strong> ${value}</div>
              `).join('')}
            </div>
            ` : ''}

            <div style="margin-top: 30px; padding: 20px; background: #eff6ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
              <p style="margin: 0; color: #1e40af; font-size: 14px;">
                💡 <strong>Dica:</strong> Acesse o painel de alertas para configurar suas preferências de notificação e ajustar os limites de threshold.
              </p>
            </div>
          </div>

          <!-- Footer -->
          <div class="footer">
            <div class="footer-logo">⚡ Teia GEO</div>
            <p style="margin: 10px 0;">
              Observabilidade Cognitiva de IAs Generativas
            </p>
            <p style="margin: 5px 0; font-size: 12px;">
              Este é um email automático. Gerado em ${new Date().toLocaleString('pt-BR')}
            </p>
            <p style="margin: 15px 0; font-size: 12px;">
              <a href="${Deno.env.get('APP_URL') || 'https://id-preview--a1c06a98-7d12-40f5-885f-0199526950ab.lovable.app'}/alerts" style="color: #6366f1; text-decoration: none;">
                ⚙️ Gerenciar Preferências de Alertas
              </a>
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Enviar email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Teia GEO Alerts <alerts@resend.dev>",
        to: [userEmail],
        subject: `${config.emoji} ${config.title} - ${brandName}`,
        html: htmlContent,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      throw new Error(`Resend API error: ${JSON.stringify(emailData)}`);
    }

    console.log("[ALERT-NOTIFICATION] Email enviado com sucesso:", {
      emailId: emailData.id,
      userEmail,
      alertType
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        emailId: emailData.id,
        message: "Alerta enviado com sucesso"
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
    console.error("[ALERT-NOTIFICATION] Erro ao enviar email:", error);
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
};

serve(handler);
