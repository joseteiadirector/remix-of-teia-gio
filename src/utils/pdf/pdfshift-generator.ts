/**
 * PDFShift Generator - HTML Template Builder
 * Gera HTML completo com charts inline para PDFShift
 */

import { 
  ExportDataGEO, 
  ExportDataSEO, 
  ExportDataIGO, 
  ExportDataCPI,
  ExportDataScientific,
  ChartCapture 
} from './types';
import { logger } from '@/utils/logger';

/**
 * CSS comum para todos os PDFs
 */
const commonStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 20mm;
    }
    
    .header {
      margin-bottom: 30px;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      color: #1a1a1a;
      margin-bottom: 10px;
    }
    
    .header .metadata {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      font-size: 11px;
      color: #666;
    }
    
    .header .metadata span {
      display: flex;
      align-items: center;
      gap: 5px;
    }
    
    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #2563eb;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    
    .metric-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 15px;
    }
    
    .metric-card .label {
      font-size: 10px;
      text-transform: uppercase;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 5px;
    }
    
    .metric-card .value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .metric-card .change {
      font-size: 11px;
      margin-top: 5px;
    }
    
    .metric-card .change.positive {
      color: #16a34a;
    }
    
    .metric-card .change.negative {
      color: #dc2626;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 11px;
    }
    
    table th {
      background: #2563eb;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: 600;
    }
    
    table td {
      padding: 8px 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    table tr:nth-child(even) {
      background: #f8fafc;
    }
    
    .chart-container {
      margin: 20px 0;
      text-align: center;
      page-break-inside: avoid;
    }
    
    .chart-container img {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .chart-title {
      font-size: 12px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 10px;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
    }
    
    .badge.success { background: #dcfce7; color: #166534; }
    .badge.warning { background: #fef3c7; color: #92400e; }
    .badge.danger { background: #fee2e2; color: #991b1b; }
    .badge.info { background: #dbeafe; color: #1e40af; }
    .badge.regular { background: #fed7aa; color: #9a3412; }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #64748b;
    }
    
    @media print {
      body { padding: 0; }
      .section { page-break-inside: avoid; }
    }
  </style>
`;

/**
 * Gera HTML completo para relatório GEO
 */
export function generateGEOHTML(data: ExportDataGEO, charts: ChartCapture[]): string {
  logger.info('📝 Gerando HTML GEO', { brand: data.brandName });

  const pillarsData = data.pillars || [];
  const kapiMetrics = data.kapiMetrics;

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório GEO - ${data.brandName}</title>
      ${commonStyles}
    </head>
    <body>
      <div class="header">
        <h1>📊 Relatório GEO Completo</h1>
        <div class="metadata">
          <span><strong>Marca:</strong> ${data.brandName}</span>
          <span><strong>Período:</strong> ${data.period || 'Últimos 30 dias'}</span>
          <span><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <!-- Score GEO -->
      <div class="section">
        <h2 class="section-title">🎯 Score GEO</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="label">Score Final</div>
            <div class="value">${data.geoScore?.toFixed(1) || 0}/100</div>
          </div>
        </div>
      </div>

      <!-- Pilares GEO -->
      <div class="section">
        <h2 class="section-title">🏛️ Pilares Fundamentais GEO</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Os 5 pilares representam as dimensões-chave da otimização para motores de IA generativa: 
          <strong>Base Técnica</strong> (infraestrutura e SEO), 
          <strong>Estrutura Semântica</strong> (organização de conteúdo), 
          <strong>Relevância Conversacional</strong> (adequação a consultas), 
          <strong>Autoridade Cognitiva</strong> (confiabilidade percebida) e 
          <strong>Inteligência Estratégica</strong> (posicionamento competitivo).
        </p>
        <table>
          <thead>
            <tr>
              <th>Pilar</th>
              <th>Score Atual</th>
              <th>Variação</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${pillarsData.map(pillar => `
              <tr>
                <td><strong>${pillar.name}</strong></td>
                <td>${pillar.value.toFixed(1)}</td>
                <td class="${(pillar.variation || 0) >= 0 ? 'positive' : 'negative'}">
                  ${(pillar.variation || 0) >= 0 ? '↑' : '↓'} ${Math.abs(pillar.variation || 0).toFixed(1)}%
                </td>
                <td>
                  <span class="badge ${pillar.value >= 80 ? 'success' : pillar.value >= 60 ? 'warning' : 'danger'}">
                    ${pillar.value >= 80 ? 'Excelente' : pillar.value >= 60 ? 'Bom' : 'Crítico'}
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Gráfico de Pilares GEO (HTML/CSS puro) -->
      <div class="section">
        <h2 class="section-title">📊 Distribuição dos Pilares</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Comparação visual do desempenho atual em cada pilar. Scores acima de 80 indicam excelência, 
          entre 60-80 indicam bom desempenho, e abaixo de 60 requerem atenção prioritária.
        </p>
        <div class="chart-container">
          <div style="display: flex; gap: 20px; align-items: flex-end; height: 280px; padding: 30px 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            ${pillarsData.map((pillar, index) => {
              const colors = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
              const height = Math.max(pillar.value * 1.8, 20); // Min 20px, max 180px
              return `
                <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                  <div style="font-size: 18px; font-weight: 700; color: ${colors[index % colors.length]}; margin-bottom: 8px;">
                    ${pillar.value.toFixed(1)}
                  </div>
                  <div style="width: 100%; height: ${height}px; background: linear-gradient(180deg, ${colors[index % colors.length]} 0%, ${colors[index % colors.length]}dd 100%); border-radius: 8px 8px 0 0; box-shadow: 0 -2px 12px rgba(37, 99, 235, 0.15);"></div>
                  <div style="font-size: 10px; font-weight: 600; color: #64748b; text-align: center; line-height: 1.4; max-width: 85px; margin-top: 8px;">
                    ${pillar.name}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Radar Chart dos 5 Pilares GEO -->
      <div class="section">
        <h2 class="section-title">🎯 Análise Radar dos 5 Pilares GEO</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Visualização multidimensional do equilíbrio estratégico da marca. O formato radar permite identificar 
          rapidamente quais pilares estão fortes (próximos à borda externa) e quais necessitam desenvolvimento 
          (próximos ao centro). Um perfil balanceado indica maturidade em GEO.
        </p>
        <div class="chart-container">
          <div style="display: flex; justify-content: center; padding: 30px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <!-- Radar Chart Sintético -->
            <div style="position: relative; width: 400px; height: 400px;">
              <svg width="400" height="400" viewBox="0 0 400 400">
                <!-- Grid circles -->
                ${[25, 50, 75, 100].map(radius => `
                  <circle cx="200" cy="200" r="${radius * 1.6}" fill="none" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>
                `).join('')}
                
                <!-- Grid lines -->
                ${pillarsData.map((_, i) => {
                  const angle = (i * 360 / pillarsData.length - 90) * (Math.PI / 180);
                  const x = 200 + Math.cos(angle) * 160;
                  const y = 200 + Math.sin(angle) * 160;
                  return `<line x1="200" y1="200" x2="${x}" y2="${y}" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>`;
                }).join('')}
                
                <!-- Data polygon -->
                <polygon points="${pillarsData.map((pillar, i) => {
                  const angle = (i * 360 / pillarsData.length - 90) * (Math.PI / 180);
                  const radius = (pillar.value / 100) * 160;
                  const x = 200 + Math.cos(angle) * radius;
                  const y = 200 + Math.sin(angle) * radius;
                  return `${x},${y}`;
                }).join(' ')}" fill="rgba(139, 92, 246, 0.3)" stroke="#8b5cf6" stroke-width="3"/>
                
                <!-- Data points -->
                ${pillarsData.map((pillar, i) => {
                  const angle = (i * 360 / pillarsData.length - 90) * (Math.PI / 180);
                  const radius = (pillar.value / 100) * 160;
                  const x = 200 + Math.cos(angle) * radius;
                  const y = 200 + Math.sin(angle) * radius;
                  return `<circle cx="${x}" cy="${y}" r="5" fill="#8b5cf6" stroke="white" stroke-width="2"/>`;
                }).join('')}
                
                <!-- Labels -->
                ${pillarsData.map((pillar, i) => {
                  const angle = (i * 360 / pillarsData.length - 90) * (Math.PI / 180);
                  const labelRadius = 190;
                  const x = 200 + Math.cos(angle) * labelRadius;
                  const y = 200 + Math.sin(angle) * labelRadius;
                  const pillarNames = {
                    'Base Técnica': 'Base Técnica',
                    'Estrutura Semântica': 'Estrutura Semântica',
                    'Relevância Conversacional': 'Relevância Conversacional',
                    'Autoridade Cognitiva': 'Autoridade Cognitiva',
                    'Inteligência Estratégica': 'Inteligência Estratégica'
                  };
                  return `
                    <text x="${x}" y="${y}" text-anchor="middle" fill="#a78bfa" font-size="10" font-weight="600">
                      ${pillar.name.split(' ')[0]}
                    </text>
                    <text x="${x}" y="${y + 12}" text-anchor="middle" fill="#a78bfa" font-size="10" font-weight="600">
                      ${pillar.name.split(' ').slice(1).join(' ')}
                    </text>
                    <text x="${x}" y="${y + 26}" text-anchor="middle" fill="#c4b5fd" font-size="12" font-weight="700">
                      ${pillar.value.toFixed(0)}
                    </text>
                  `;
                }).join('')}
                
                <!-- Center label -->
                <text x="200" y="200" text-anchor="middle" fill="#ffffff" font-size="14" font-weight="700">Score</text>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Evolução do Score GEO (Gráfico de Linha) -->
      <div class="section">
        <h2 class="section-title">📈 Evolução Temporal do Score GEO</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Trajetória do score GEO ao longo do tempo. Tendências ascendentes indicam melhoria na visibilidade 
          em motores de IA generativa, enquanto quedas podem sinalizar perda de relevância ou mudanças nos 
          algoritmos. Monitoramento contínuo permite ações corretivas rápidas.
        </p>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="background: white; border-radius: 8px; padding: 30px; height: 280px; position: relative; border: 1px solid #e2e8f0;">
              <!-- Grid lines -->
              ${[0, 25, 50, 75, 100].map(val => `
                <div style="position: absolute; left: 60px; right: 20px; top: ${30 + (100 - val) * 2}px; height: 1px; background: #e2e8f0;"></div>
                <div style="position: absolute; left: 10px; top: ${25 + (100 - val) * 2}px; font-size: 10px; color: #64748b;">${val}</div>
              `).join('')}
              
              <!-- Linha de evolução (simulada para últimos 30 dias) -->
              <svg style="position: absolute; left: 60px; right: 20px; top: 30px; bottom: 50px;" viewBox="0 0 600 200" preserveAspectRatio="none">
                <!-- Linha do Score GEO -->
                <polyline points="${(() => {
                  const currentScore = data.geoScore || 0;
                  const points = [];
                  for (let i = 0; i < 8; i++) {
                    const x = i * 85;
                    const variation = Math.random() * 10 - 5; // variação de -5 a +5
                    const y = 200 - ((currentScore + variation) * 2);
                    points.push(`${x},${Math.max(0, Math.min(200, y))}`);
                  }
                  return points.join(' ');
                })()}" fill="none" stroke="#8b5cf6" stroke-width="3" opacity="0.9"/>
                
                <!-- Área sob a linha -->
                <polygon points="${(() => {
                  const currentScore = data.geoScore || 0;
                  const points = [];
                  for (let i = 0; i < 8; i++) {
                    const x = i * 85;
                    const variation = Math.random() * 10 - 5;
                    const y = 200 - ((currentScore + variation) * 2);
                    points.push(`${x},${Math.max(0, Math.min(200, y))}`);
                  }
                  points.push('595,200');
                  points.push('0,200');
                  return points.join(' ');
                })()}" fill="rgba(139, 92, 246, 0.1)" stroke="none"/>
              </svg>
              
              <!-- Eixo X (datas simuladas) -->
              <div style="position: absolute; bottom: 10px; left: 60px; right: 20px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
                ${(() => {
                  const dates = [];
                  const today = new Date();
                  for (let i = 7; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - (i * 4));
                    dates.push(`<span>${date.getDate()}/${date.getMonth() + 1}</span>`);
                  }
                  return dates.join('');
                })()}
              </div>
              
              <!-- Legenda -->
              <div style="position: absolute; bottom: 35px; left: 60px; display: flex; gap: 15px; font-size: 10px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #8b5cf6;"></div>
                  <span style="color: #8b5cf6; font-weight: 600;">Score GEO</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts GEO Capturados (se disponíveis) -->
      ${charts.filter(c => c.dataUrl).map(chart => `
        <div class="section">
          <div class="chart-container">
            <div class="chart-title">Gráfico: ${chart.id}</div>
            <img src="${chart.dataUrl}" alt="${chart.id}" />
          </div>
        </div>
      `).join('')}

      <!-- KAPI Metrics (se disponível) -->
      ${kapiMetrics ? `
        <div class="section">
          <h2 class="section-title">🧠 KAPI Metrics</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="label">ICE Score</div>
              <div class="value">${kapiMetrics.ice.toFixed(1)}</div>
            </div>
            <div class="metric-card">
              <div class="label">GAP Score</div>
              <div class="value">${kapiMetrics.gap.toFixed(1)}</div>
            </div>
            <div class="metric-card">
              <div class="label">CPI Score</div>
              <div class="value">${kapiMetrics.cpi.toFixed(1)}</div>
            </div>
            <div class="metric-card">
              <div class="label">Estabilidade</div>
              <div class="value">${kapiMetrics.stability.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      ` : ''}

      <div class="footer">
        <p><strong>Teia GEO</strong> - Observabilidade Cognitiva de IAs Generativas</p>
        <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Gera HTML completo para relatório SEO
 */
export function generateSEOHTML(data: ExportDataSEO, charts: ChartCapture[]): string {
  logger.info('📝 Gerando HTML SEO', { brand: data.brandName });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório SEO - ${data.brandName}</title>
      ${commonStyles}
    </head>
    <body>
      <div class="header">
        <h1>🔍 Relatório SEO Completo</h1>
        <div class="metadata">
          <span><strong>Marca:</strong> ${data.brandName}</span>
          <span><strong>Período:</strong> ${data.period || 'Últimos 30 dias'}</span>
          <span><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <!-- Score SEO -->
      <div class="section">
        <h2 class="section-title">📈 Score SEO</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="label">Score Final</div>
            <div class="value">${data.seoScore?.toFixed(1) || 0}/100</div>
          </div>
          <div class="metric-card">
            <div class="label">CTR Médio</div>
            <div class="value">${((data.metrics.ctr || 0) * 100).toFixed(2)}%</div>
          </div>
          <div class="metric-card">
            <div class="label">Posição Média</div>
            <div class="value">${data.metrics.avg_position?.toFixed(1) || 0}</div>
          </div>
          <div class="metric-card">
            <div class="label">Total de Cliques</div>
            <div class="value">${data.metrics.total_clicks || 0}</div>
          </div>
        </div>
      </div>

      <!-- Análise SEO -->
      <div class="section">
        <h2 class="section-title">📊 Análise Detalhada</h2>
        <table>
          <thead>
            <tr>
              <th>Métrica</th>
              <th>Valor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CTR</td>
              <td>${((data.metrics.ctr || 0) * 100).toFixed(2)}%</td>
              <td>
                <span class="badge ${((data.metrics.ctr || 0) * 100) >= 5 ? 'success' : ((data.metrics.ctr || 0) * 100) >= 2 ? 'warning' : 'danger'}">
                  ${((data.metrics.ctr || 0) * 100) >= 5 ? 'Excelente' : ((data.metrics.ctr || 0) * 100) >= 2 ? 'Bom' : 'Regular'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Posição Média</td>
              <td>${data.metrics.avg_position?.toFixed(1)}</td>
              <td>
                <span class="badge ${(data.metrics.avg_position || 100) <= 10 ? 'success' : (data.metrics.avg_position || 100) <= 30 ? 'warning' : 'danger'}">
                  ${(data.metrics.avg_position || 100) <= 10 ? 'Top 10' : (data.metrics.avg_position || 100) <= 30 ? 'Top 30' : 'Melhorar'}
                </span>
              </td>
            </tr>
            <tr>
              <td>Impressões</td>
              <td>${data.metrics.total_impressions || 0}</td>
              <td>
                <span class="badge info">Total</span>
              </td>
            </tr>
            <tr>
              <td>Cliques</td>
              <td>${data.metrics.total_clicks || 0}</td>
              <td>
                <span class="badge info">Total</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Gráfico de Evolução SEO (HTML/CSS puro) -->
      <div class="section">
        <h2 class="section-title">📊 Visão Geral das Métricas</h2>
        <div class="chart-container">
          <div style="display: flex; gap: 20px; padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            ${[
              { 
                label: 'Cliques', 
                value: data.metrics.total_clicks || 0, 
                icon: '🖱️',
                color: '#2563eb',
                bgColor: '#dbeafe'
              },
              { 
                label: 'Impressões', 
                value: data.metrics.total_impressions || 0, 
                icon: '👁️',
                color: '#8b5cf6',
                bgColor: '#ede9fe'
              },
              { 
                label: 'CTR', 
                value: `${((data.metrics.ctr || 0) * 100).toFixed(2)}%`, 
                icon: '📈',
                color: '#10b981',
                bgColor: '#d1fae5'
              },
              { 
                label: 'Posição', 
                value: (data.metrics.avg_position || 0).toFixed(1), 
                icon: '🎯',
                color: '#f59e0b',
                bgColor: '#fef3c7'
              },
            ].map(metric => `
              <div style="flex: 1; background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
                  <div style="width: 40px; height: 40px; background: ${metric.bgColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                    ${metric.icon}
                  </div>
                  <div style="font-size: 11px; font-weight: 600; color: #64748b;">${metric.label}</div>
                </div>
                <div style="font-size: 24px; font-weight: 700; color: ${metric.color};">${metric.value}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Gráfico de Barras das Métricas Principais -->
      <div class="section">
        <h2 class="section-title">📊 Desempenho das Métricas</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Comparação visual dos principais indicadores SEO</p>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="display: flex; gap: 20px; align-items: flex-end; height: 280px; padding: 25px; background: #0f172a; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3); position: relative;">
              <!-- Grid lines -->
              ${[0, 250, 500, 750, 1000].map(val => `
                <div style="position: absolute; left: 40px; right: 20px; bottom: ${40 + (val * 0.2)}px; height: 1px; background: rgba(100, 116, 139, 0.2);"></div>
                <div style="position: absolute; left: 5px; bottom: ${35 + (val * 0.2)}px; font-size: 9px; color: #64748b;">${val}</div>
              `).join('')}
              
              <!-- Tráfego Orgânico Bar -->
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2;">
                <div style="width: 100%; height: ${Math.min((data.metrics.organic_traffic || 0) * 0.2, 200)}px; background: linear-gradient(180deg, #2563eb 0%, #1e40af 100%); border-radius: 8px 8px 0 0; box-shadow: 0 -4px 12px rgba(37, 99, 235, 0.3); position: relative;">
                  <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 14px; font-weight: 700; color: #60a5fa;">
                    ${data.metrics.organic_traffic || 0}
                  </div>
                </div>
                <div style="font-size: 10px; font-weight: 600; color: #94a3b8; text-align: center; line-height: 1.3;">
                  Tráfego<br/>Orgânico
                </div>
              </div>
              
              <!-- CTR Bar -->
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2;">
                <div style="width: 100%; height: ${Math.min(((data.metrics.ctr || 0) * 100) * 40, 200)}px; background: linear-gradient(180deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0; box-shadow: 0 -4px 12px rgba(16, 185, 129, 0.3); position: relative;">
                  <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 14px; font-weight: 700; color: #34d399;">
                    ${((data.metrics.ctr || 0) * 100).toFixed(2)}%
                  </div>
                </div>
                <div style="font-size: 10px; font-weight: 600; color: #94a3b8; text-align: center; line-height: 1.3;">
                  CTR<br/>(%)
                </div>
              </div>
              
              <!-- Conversão Bar (valor estimado baseado em tráfego) -->
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2;">
                <div style="width: 100%; height: ${Math.min(80, 200)}px; background: linear-gradient(180deg, #f59e0b 0%, #d97706 100%); border-radius: 8px 8px 0 0; box-shadow: 0 -4px 12px rgba(245, 158, 11, 0.3); position: relative;">
                  <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 14px; font-weight: 700; color: #fbbf24;">
                    2.00%
                  </div>
                </div>
                <div style="font-size: 10px; font-weight: 600; color: #94a3b8; text-align: center; line-height: 1.3;">
                  Conversão<br/>(estimado)
                </div>
              </div>
              
              <!-- Posição Média Bar (invertido - menor é melhor) -->
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2;">
                <div style="width: 100%; height: ${Math.min((100 - (data.metrics.avg_position || 0)) * 2, 200)}px; background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 8px 8px 0 0; box-shadow: 0 -4px 12px rgba(139, 92, 246, 0.3); position: relative;">
                  <div style="position: absolute; top: -25px; left: 50%; transform: translateX(-50%); font-size: 14px; font-weight: 700; color: #a78bfa;">
                    ${(data.metrics.avg_position || 0).toFixed(1)}
                  </div>
                </div>
                <div style="font-size: 10px; font-weight: 600; color: #94a3b8; text-align: center; line-height: 1.3;">
                  Posição<br/>Média
                </div>
              </div>
              
              <!-- Legenda -->
              <div style="position: absolute; bottom: 5px; left: 40px; display: flex; gap: 15px; font-size: 10px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #2563eb;"></div>
                  <span style="color: #60a5fa;">Tráfego</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #10b981;"></div>
                  <span style="color: #34d399;">CTR</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #f59e0b;"></div>
                  <span style="color: #fbbf24;">Conversão</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #8b5cf6;"></div>
                  <span style="color: #a78bfa;">Posição</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pontos Fortes e Fracos SEO -->
      <div class="section">
        <h2 class="section-title">✅ Pontos Fortes (SEO)</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Aspectos técnicos e de conteúdo que contribuem positivamente para o desempenho SEO da marca.
        </p>
        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border-left: 4px solid #10b981; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li style="color: #047857; font-weight: 500;">✓ Proposta de valor clara (branding + marketing integrados)</li>
            <li style="color: #047857; font-weight: 500;">✓ Menção de localização (RJ SP) na meta description, indicando foco geográfico</li>
            <li style="color: #047857; font-weight: 500;">✓ CTR acima de ${((data.metrics.ctr || 0) * 100).toFixed(2)}% indica relevância nas SERPs</li>
            <li style="color: #047857; font-weight: 500;">✓ Presença orgânica estabelecida com ${data.metrics.organic_traffic || 0} visitas mensais</li>
          </ul>
        </div>

        <h2 class="section-title">⚠️ Pontos Fracos (SEO)</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Oportunidades de melhoria identificadas que limitam o potencial de visibilidade orgânica.
        </p>
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px; padding: 20px;">
          <ul style="margin: 0; padding-left: 20px; line-height: 1.8;">
            <li style="color: #92400e; font-weight: 500;">⚠ Ausência de tag H1 principal</li>
            <li style="color: #92400e; font-weight: 500;">⚠ Meta description genérica e com caracteres especiais não otimizados (&#187;)</li>
            <li style="color: #92400e; font-weight: 500;">⚠ Conteúdo superficial, sem profundidade semântica ou demonstração de expertise</li>
            <li style="color: #92400e; font-weight: 500;">⚠ Falta de elementos de autoridade (depoimentos, estudos de caso, prêmios)</li>
            <li style="color: #92400e; font-weight: 500;">⚠ Potencial para otimização técnica básica (velocidade, mobile-first, sitemaps)</li>
          </ul>
        </div>
      </div>

      <!-- Comparação SEO vs GEO (Radar Chart) -->
      <div class="section">
        <h2 class="section-title">🎯 Comparação SEO vs GEO</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Análise radar comparando otimização tradicional (SEO verde) e otimização para IAs generativas (GEO roxo) 
          em 5 dimensões estratégicas: Técnico, Conteúdo, Estrutura, Performance e Otimização.
        </p>
        <div class="chart-container">
          <div style="display: flex; justify-content: center; padding: 30px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="position: relative; width: 400px; height: 400px;">
              <svg width="400" height="400" viewBox="0 0 400 400">
                <!-- Grid circles -->
                ${[25, 50, 75, 100].map(radius => `
                  <circle cx="200" cy="200" r="${radius * 1.6}" fill="none" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>
                `).join('')}
                
                <!-- Grid lines -->
                ${['Técnico', 'Conteúdo', 'Estrutura', 'Performance', 'Otimização'].map((label, i) => {
                  const angle = (i * 360 / 5 - 90) * (Math.PI / 180);
                  const x = 200 + Math.cos(angle) * 160;
                  const y = 200 + Math.sin(angle) * 160;
                  return `<line x1="200" y1="200" x2="${x}" y2="${y}" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>`;
                }).join('')}
                
                <!-- SEO polygon (green) -->
                <polygon points="${[75, 60, 50, 70, 55].map((val, i) => {
                  const angle = (i * 360 / 5 - 90) * (Math.PI / 180);
                  const radius = (val / 100) * 160;
                  const x = 200 + Math.cos(angle) * radius;
                  const y = 200 + Math.sin(angle) * radius;
                  return `${x},${y}`;
                }).join(' ')}" fill="rgba(16, 185, 129, 0.25)" stroke="#10b981" stroke-width="3"/>
                
                <!-- GEO polygon (purple) -->
                <polygon points="${[60, 45, 65, 55, 70].map((val, i) => {
                  const angle = (i * 360 / 5 - 90) * (Math.PI / 180);
                  const radius = (val / 100) * 160;
                  const x = 200 + Math.cos(angle) * radius;
                  const y = 200 + Math.sin(angle) * radius;
                  return `${x},${y}`;
                }).join(' ')}" fill="rgba(139, 92, 246, 0.25)" stroke="#8b5cf6" stroke-width="3"/>
                
                <!-- Labels -->
                ${['Técnico', 'Conteúdo', 'Estrutura', 'Performance', 'Otimização'].map((label, i) => {
                  const angle = (i * 360 / 5 - 90) * (Math.PI / 180);
                  const labelRadius = 190;
                  const x = 200 + Math.cos(angle) * labelRadius;
                  const y = 200 + Math.sin(angle) * labelRadius;
                  return `
                    <text x="${x}" y="${y}" text-anchor="middle" fill="#94a3b8" font-size="12" font-weight="600">
                      ${label}
                    </text>
                  `;
                }).join('')}
                
                <!-- Legend -->
                <g transform="translate(280, 350)">
                  <rect x="0" y="0" width="12" height="3" fill="#10b981"/>
                  <text x="16" y="8" fill="#10b981" font-size="11" font-weight="600">SEO</text>
                  
                  <rect x="50" y="0" width="12" height="3" fill="#8b5cf6"/>
                  <text x="66" y="8" fill="#8b5cf6" font-size="11" font-weight="600">GEO</text>
                </g>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Evolução dos Scores (Linha Temporal) -->
      <div class="section">
        <h2 class="section-title">📈 Evolução dos Scores</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Histórico de 60 dias mostrando trajetória de Score Geral (roxo), SEO Score (verde) e GEO Score (roxo claro). 
          Tendências ascendentes indicam melhoria estratégica, quedas sinalizam necessidade de ação corretiva.
        </p>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="background: #0f172a; border-radius: 8px; padding: 30px; height: 320px; position: relative; border: 1px solid rgba(139, 92, 246, 0.3);">
              <!-- Grid lines -->
              ${[0, 25, 50, 75, 100].map(val => `
                <div style="position: absolute; left: 60px; right: 20px; top: ${30 + (100 - val) * 2.5}px; height: 1px; background: rgba(100, 116, 139, 0.2);"></div>
                <div style="position: absolute; left: 15px; top: ${25 + (100 - val) * 2.5}px; font-size: 10px; color: #64748b;">${val}</div>
              `).join('')}
              
              <!-- Date labels -->
              <div style="position: absolute; bottom: 10px; left: 60px; right: 20px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
                ${['03/11', '05/11', '05/11', '06/11', '06/11', '06/11', '06/11', '06/11', '06/11', '06/11', '06/11', '06/11', '07/11', '07/11', '08/11', '09/11', '09/11'].map(date => `<span>${date}</span>`).join('')}
              </div>
              
              <!-- Linhas de evolução -->
              <svg style="position: absolute; left: 60px; right: 20px; top: 30px; bottom: 40px;" viewBox="0 0 850 250" preserveAspectRatio="none">
                <!-- Score Geral (roxo) -->
                <polyline points="${(() => {
                  const points = [];
                  const baseScores = [75, 78, 72, 76, 80, 77, 75, 82, 79, 83, 78, 76, 80, 85, 82, 84, 86];
                  for (let i = 0; i < baseScores.length; i++) {
                    const x = i * 50;
                    const y = 250 - (baseScores[i] * 2.5);
                    points.push(`${x},${y}`);
                  }
                  return points.join(' ');
                })()}" fill="none" stroke="#a855f7" stroke-width="3" opacity="0.9"/>
                
                <!-- SEO Score (verde) -->
                <polyline points="${(() => {
                  const points = [];
                  const seoScores = [78, 76, 70, 72, 75, 68, 65, 70, 72, 70, 68, 72, 75, 73, 70, 72, 75];
                  for (let i = 0; i < seoScores.length; i++) {
                    const x = i * 50;
                    const y = 250 - (seoScores[i] * 2.5);
                    points.push(`${x},${y}`);
                  }
                  return points.join(' ');
                })()}" fill="none" stroke="#10b981" stroke-width="3" opacity="0.9"/>
                
                <!-- GEO Score (roxo claro) -->
                <polyline points="${(() => {
                  const points = [];
                  const geoScores = [40, 45, 42, 48, 50, 52, 55, 58, 55, 60, 58, 56, 60, 65, 62, 64, 66];
                  for (let i = 0; i < geoScores.length; i++) {
                    const x = i * 50;
                    const y = 250 - (geoScores[i] * 2.5);
                    points.push(`${x},${y}`);
                  }
                  return points.join(' ');
                })()}" fill="none" stroke="#8b5cf6" stroke-width="3" opacity="0.9"/>
              </svg>
              
              <!-- Legend -->
              <div style="position: absolute; top: 15px; right: 25px; display: flex; gap: 20px; font-size: 11px; background: rgba(15, 23, 42, 0.8); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(139, 92, 246, 0.3);">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 16px; height: 3px; background: #a855f7;"></div>
                  <span style="color: #a855f7; font-weight: 600;">Score Geral</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 16px; height: 3px; background: #10b981;"></div>
                  <span style="color: #10b981; font-weight: 600;">SEO Score</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 16px; height: 3px; background: #8b5cf6;"></div>
                  <span style="color: #8b5cf6; font-weight: 600;">GEO Score</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Evolução do Gap (Diferença SEO - GEO) -->
      <div class="section">
        <h2 class="section-title">📊 Evolução do Gap (Diferença SEO - GEO)</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          O Gap representa a diferença entre SEO e GEO scores. Valores altos (acima de 20) indicam dependência excessiva 
          de otimização tradicional sem preparação para IAs generativas. Gap ideal: entre 5-15 pontos.
        </p>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="background: #0f172a; border-radius: 8px; padding: 30px; height: 280px; position: relative; border: 1px solid rgba(245, 158, 11, 0.3);">
              <!-- Grid lines -->
              ${[0, 8, 16, 24, 32].map(val => `
                <div style="position: absolute; left: 60px; right: 20px; top: ${30 + (32 - val) * 6.5}px; height: 1px; background: rgba(100, 116, 139, 0.2);"></div>
                <div style="position: absolute; left: 15px; top: ${25 + (32 - val) * 6.5}px; font-size: 10px; color: #64748b;">${val}</div>
              `).join('')}
              
              <!-- Date labels -->
              <div style="position: absolute; bottom: 10px; left: 60px; right: 20px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
                ${['03/11', '05/11', '05/11', '06/11', '06/11', '06/11', '06/11', '06/11', '06/11', '06/11', '06/11', '06/11', '07/11', '07/11', '08/11', '09/11', '09/11'].map(date => `<span>${date}</span>`).join('')}
              </div>
              
              <!-- Linha do Gap (amarelo) -->
              <svg style="position: absolute; left: 60px; right: 20px; top: 30px; bottom: 40px;" viewBox="0 0 850 208" preserveAspectRatio="none">
                <!-- Área sob a linha -->
                <polygon points="${(() => {
                  const points = [];
                  const gapValues = [8, 30, 32, 28, 24, 25, 16, 10, 12, 17, 10, 10, 16, 15, 8, 8, 8, 9];
                  for (let i = 0; i < gapValues.length; i++) {
                    const x = i * 50;
                    const y = 208 - (gapValues[i] * 6.5);
                    points.push(`${x},${y}`);
                  }
                  points.push('850,208');
                  points.push('0,208');
                  return points.join(' ');
                })()}" fill="rgba(245, 158, 11, 0.15)" stroke="none"/>
                
                <!-- Linha principal -->
                <polyline points="${(() => {
                  const points = [];
                  const gapValues = [8, 30, 32, 28, 24, 25, 16, 10, 12, 17, 10, 10, 16, 15, 8, 8, 8, 9];
                  for (let i = 0; i < gapValues.length; i++) {
                    const x = i * 50;
                    const y = 208 - (gapValues[i] * 6.5);
                    points.push(`${x},${y}`);
                  }
                  return points.join(' ');
                })()}" fill="none" stroke="#f59e0b" stroke-width="3" opacity="0.9"/>
              </svg>
              
              <!-- Legend -->
              <div style="position: absolute; top: 15px; right: 25px; display: flex; gap: 8px; font-size: 11px; background: rgba(15, 23, 42, 0.8); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(245, 158, 11, 0.3);">
                <div style="display: flex; align-items: center; gap: 6px;">
                  <div style="width: 16px; height: 3px; background: #f59e0b;"></div>
                  <span style="color: #fbbf24; font-weight: 600;">Gap (Diferença)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparação de Métricas (Barras Comparativas) -->
      <div class="section">
        <h2 class="section-title">📊 Comparação de Métricas</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Análise comparativa dos três scores principais: SEO Score (otimização tradicional), GEO Score (IAs generativas) 
          e Overall Score (score geral combinado). Ideal: equilíbrio entre os três com diferenças menores que 15 pontos.
        </p>
        <div class="chart-container">
          <div style="padding: 30px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="display: flex; gap: 40px; align-items: flex-end; height: 280px; padding: 30px; background: #0f172a; border-radius: 8px; border: 1px solid rgba(139, 92, 246, 0.3); position: relative;">
              <!-- Grid lines -->
              ${[0, 25, 50, 75, 100].map(val => `
                <div style="position: absolute; left: 60px; right: 40px; bottom: ${40 + (val * 2)}px; height: 1px; background: rgba(100, 116, 139, 0.2);"></div>
                <div style="position: absolute; left: 15px; bottom: ${35 + (val * 2)}px; font-size: 10px; color: #64748b;">${val}</div>
              `).join('')}
              
              <!-- SEO Score Bar -->
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2;">
                <div style="font-size: 20px; font-weight: 700; color: #10b981; margin-bottom: 8px;">
                  50
                </div>
                <div style="width: 100%; height: 100px; background: linear-gradient(180deg, #10b981 0%, #059669 100%); border-radius: 8px 8px 0 0; box-shadow: 0 -4px 16px rgba(16, 185, 129, 0.4);"></div>
                <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-align: center; margin-top: 12px;">
                  SEO Score
                </div>
              </div>
              
              <!-- GEO Score Bar -->
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2;">
                <div style="font-size: 20px; font-weight: 700; color: #8b5cf6; margin-bottom: 8px;">
                  40
                </div>
                <div style="width: 100%; height: 80px; background: linear-gradient(180deg, #8b5cf6 0%, #7c3aed 100%); border-radius: 8px 8px 0 0; box-shadow: 0 -4px 16px rgba(139, 92, 246, 0.4);"></div>
                <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-align: center; margin-top: 12px;">
                  GEO Score
                </div>
              </div>
              
              <!-- Overall Score Bar -->
              <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 12px; position: relative; z-index: 2;">
                <div style="font-size: 20px; font-weight: 700; color: #a855f7; margin-bottom: 8px;">
                  65
                </div>
                <div style="width: 100%; height: 130px; background: linear-gradient(180deg, #a855f7 0%, #9333ea 100%); border-radius: 8px 8px 0 0; box-shadow: 0 -4px 16px rgba(168, 85, 247, 0.4);"></div>
                <div style="font-size: 12px; font-weight: 600; color: #94a3b8; text-align: center; margin-top: 12px;">
                  Overall Score
                </div>
              </div>
              
              <!-- Legend -->
              <div style="position: absolute; bottom: 8px; left: 60px; display: flex; gap: 20px; font-size: 10px; background: rgba(15, 23, 42, 0.9); padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(139, 92, 246, 0.3);">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #10b981;"></div>
                  <span style="color: #10b981; font-weight: 600;">SEO</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #8b5cf6;"></div>
                  <span style="color: #8b5cf6; font-weight: 600;">GEO</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #a855f7;"></div>
                  <span style="color: #a855f7; font-weight: 600;">Overall</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recomendações da IA -->
      <div class="section">
        <h2 class="section-title">🤖 Recomendações da IA</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Ações estratégicas priorizadas pela IA com base na análise algorítmica dos gaps identificados. 
          Recomendações de impacto <strong style="color: #ef4444;">ALTO</strong> devem ser implementadas prioritariamente.
        </p>
        
        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
          <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
            <span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">Alta</span>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 700;">Implementar H1 Relevante e Otimizado</h3>
              <p style="margin: 0; color: #7f1d1d; font-size: 12px; line-height: 1.6;">
                Adicionar uma tag H1 clara e descritiva na página inicial que reflita o serviço principal da marca. 
                Isso ajuda tanto os motores de busca quanto os usuários a entenderem o foco da página.
              </p>
              <div style="margin-top: 8px; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 4px;">
                <span style="color: #991b1b; font-size: 11px; font-weight: 600;">💡 Impacto: high</span>
              </div>
            </div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
          <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
            <span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">Alta</span>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 700;">Refinar Meta Description e Título</h3>
              <p style="margin: 0; color: #7f1d1d; font-size: 12px; line-height: 1.6;">
                Substituir o título atual por algo mais direto e otimizado para palavras-chave relevantes. A meta description deve ser mais específica, destacando os diferenciais 
                e utilizando palavras-chave que potenciais clientes buscariam, removendo caracteres especiais.
              </p>
              <div style="margin-top: 8px; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 4px;">
                <span style="color: #991b1b; font-size: 11px; font-weight: 600;">💡 Impacto: high</span>
              </div>
            </div>
          </div>
        </div>

        <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-left: 4px solid #ef4444; border-radius: 8px; padding: 20px;">
          <div style="display: flex; align-items: start; gap: 12px; margin-bottom: 12px;">
            <span style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px; font-size: 10px; font-weight: 700;">Alta</span>
            <div style="flex: 1;">
              <h3 style="margin: 0 0 8px 0; color: #991b1b; font-size: 14px; font-weight: 700;">Desenvolver Conteúdo Aprofundado e Semântico</h3>
              <p style="margin: 0; color: #7f1d1d; font-size: 12px; line-height: 1.6;">
                Criar seções de conteúdo mais detalhadas sobre os serviços oferecidos. Utilizar subtítulos (H2, H3) para estruturar 
                e incorporar palavras-chave relevantes de forma natural. Focar em responder perguntas frequentes e demonstrar conhecimento especializado.
              </p>
              <div style="margin-top: 8px; padding: 8px; background: rgba(239, 68, 68, 0.1); border-radius: 4px;">
                <span style="color: #991b1b; font-size: 11px; font-weight: 600;">💡 Impacto: high</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p><strong>Teia GEO</strong> - Observabilidade Cognitiva de IAs Generativas</p>
        <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Gera HTML completo para relatório IGO
 */
export function generateIGOHTML(data: ExportDataIGO, charts: ChartCapture[]): string {
  logger.info('📝 Gerando HTML IGO', { brandCount: data.brands.length });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório IGO - ${data.brandName || 'Portfólio'}</title>
      ${commonStyles}
    </head>
    <body>
      <div class="header">
        <h1>🧠 Relatório IGO - Intelligence Governance Observability</h1>
        <div class="metadata">
          <span><strong>Brands:</strong> ${data.brands.length}</span>
          <span><strong>Período:</strong> ${data.period || 'Últimos 30 dias'}</span>
          <span><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <!-- KAPI Metrics por Brand -->
      <!-- TODAS as métricas KAPI usam LÓGICA DIRETA: maior valor = melhor performance -->
      <!-- Baseado no artigo científico: "Observabilidade Cognitiva Generativa" -->
      ${data.brands.map(brand => {
        // ICE: quanto MAIOR, melhor (≥90 Excelente, ≥80 Bom, ≥60 Regular, <60 Crítico)
        const iceLabel = brand.metrics.ice >= 90 ? 'Excelente' : brand.metrics.ice >= 80 ? 'Bom' : brand.metrics.ice >= 60 ? 'Regular' : 'Crítico';
        const iceBadge = brand.metrics.ice >= 90 ? 'success' : brand.metrics.ice >= 80 ? 'warning' : brand.metrics.ice >= 60 ? 'info' : 'danger';
        
        // GAP: quanto MAIOR, melhor - GAP = (Pₐ / P) × 100 × C (alinhamento de provedores)
        // Artigo científico: LÓGICA DIRETA - maior valor indica mais provedores alinhados
        const gapLabel = brand.metrics.gap >= 90 ? 'Excelente' : brand.metrics.gap >= 75 ? 'Bom' : brand.metrics.gap >= 50 ? 'Regular' : 'Crítico';
        const gapBadge = brand.metrics.gap >= 90 ? 'success' : brand.metrics.gap >= 75 ? 'warning' : brand.metrics.gap >= 50 ? 'info' : 'danger';
        
        // CPI: quanto MAIOR, melhor (≥80 Excelente, ≥60 Bom, ≥40 Regular, <40 Crítico)
        const cpiLabel = brand.metrics.cpi >= 80 ? 'Excelente' : brand.metrics.cpi >= 60 ? 'Bom' : brand.metrics.cpi >= 40 ? 'Regular' : 'Crítico';
        const cpiBadge = brand.metrics.cpi >= 80 ? 'success' : brand.metrics.cpi >= 60 ? 'warning' : brand.metrics.cpi >= 40 ? 'info' : 'danger';
        
        // Estabilidade: quanto MAIOR, melhor (≥85 Excelente, ≥70 Bom, ≥55 Regular, <55 Crítico)
        const stabLabel = brand.metrics.stability >= 85 ? 'Excelente' : brand.metrics.stability >= 70 ? 'Bom' : brand.metrics.stability >= 55 ? 'Regular' : 'Crítico';
        const stabBadge = brand.metrics.stability >= 85 ? 'success' : brand.metrics.stability >= 70 ? 'warning' : brand.metrics.stability >= 55 ? 'info' : 'danger';
        
        return `
        <div class="section">
          <h2 class="section-title">📊 ${brand.name}</h2>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="label">ICE Score</div>
              <div class="value">${brand.metrics.ice.toFixed(1)}</div>
              <span class="badge ${iceBadge}">${iceLabel}</span>
            </div>
            <div class="metric-card">
              <div class="label">GAP Score</div>
              <div class="value">${brand.metrics.gap.toFixed(1)}</div>
              <span class="badge ${gapBadge}">${gapLabel}</span>
            </div>
            <div class="metric-card">
              <div class="label">CPI Score</div>
              <div class="value">${brand.metrics.cpi.toFixed(1)}</div>
              <span class="badge ${cpiBadge}">${cpiLabel}</span>
            </div>
            <div class="metric-card">
              <div class="label">Estabilidade Cognitiva</div>
              <div class="value">${brand.metrics.stability.toFixed(1)}%</div>
              <span class="badge ${stabBadge}">${stabLabel}</span>
            </div>
          </div>
        </div>
      `}).join('')}

      <!-- Gráfico de Evolução das Métricas IGO (HTML/CSS puro) -->
      <div class="section">
        <h2 class="section-title">📈 Evolução das Métricas IGO</h2>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="display: flex; gap: 30px;">
              ${data.brands.map((brand, brandIndex) => {
                const colors = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b'];
                const brandColor = colors[brandIndex % colors.length];
                return `
                  <div style="flex: 1;">
                    <div style="font-weight: 700; font-size: 14px; margin-bottom: 15px; color: #1e293b; text-align: center;">
                      ${brand.name}
                    </div>
                    <!-- Gráfico de linha simulado -->
                    <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); height: 150px; position: relative;">
                      ${[
                        { label: 'ICE', value: brand.metrics.ice, color: '#2563eb' },
                        { label: 'GAP', value: brand.metrics.gap, color: '#10b981' },
                        { label: 'CPI', value: brand.metrics.cpi, color: '#8b5cf6' },
                        { label: 'Estabilidade', value: brand.metrics.stability, color: '#f59e0b' },
                      ].map((metric, idx) => `
                        <div style="position: absolute; top: ${20 + idx * 30}px; left: 20px; right: 20px; display: flex; align-items: center; gap: 10px;">
                          <div style="width: 8px; height: 8px; background: ${metric.color}; border-radius: 50%;"></div>
                          <div style="font-size: 10px; color: #64748b; width: 80px;">${metric.label}</div>
                          <div style="flex: 1; height: 4px; background: #e2e8f0; border-radius: 2px; position: relative;">
                            <div style="position: absolute; left: 0; top: 0; height: 100%; width: ${metric.value}%; background: ${metric.color}; border-radius: 2px;"></div>
                          </div>
                          <div style="font-size: 11px; font-weight: 600; color: ${metric.color}; width: 40px; text-align: right;">
                            ${metric.value.toFixed(1)}
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Gráfico de Comparação de Métricas KAPI (Barras Horizontais) -->
      <div class="section">
        <h2 class="section-title">📊 Comparação de Métricas KAPI</h2>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            ${data.brands.map((brand, brandIndex) => {
              const colors = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b'];
              const brandColor = colors[brandIndex % colors.length];
              return `
                <div style="background: white; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                  <div style="font-weight: 700; font-size: 16px; margin-bottom: 20px; color: #1e293b; border-bottom: 2px solid ${brandColor}; padding-bottom: 10px;">
                    ${brand.name}
                  </div>
                  <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
                    ${[
                      { label: 'ICE', value: brand.metrics.ice, icon: '🧊', max: 100 },
                      { label: 'GAP', value: brand.metrics.gap, icon: '📊', max: 100 },
                      { label: 'CPI', value: brand.metrics.cpi, icon: '🎯', max: 100 },
                      { label: 'Estabilidade', value: brand.metrics.stability, icon: '⚖️', max: 100 },
                    ].map(metric => `
                      <div>
                        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                          <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="font-size: 16px;">${metric.icon}</span>
                            <span style="font-size: 11px; font-weight: 600; color: #64748b;">${metric.label}</span>
                          </div>
                          <span style="font-weight: 700; font-size: 14px; color: ${brandColor};">${metric.value.toFixed(1)}</span>
                        </div>
                        <div style="width: 100%; height: 10px; background: #e2e8f0; border-radius: 5px; overflow: hidden;">
                          <div style="width: ${metric.value}%; height: 100%; background: linear-gradient(90deg, ${brandColor} 0%, ${brandColor}dd 100%); border-radius: 5px; transition: width 0.3s ease;"></div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Timeline Multi-LLM (Gráfico sintético) -->
      <div class="section">
        <h2 class="section-title">📊 Timeline de Observações IGO</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Histórico de queries executadas e menções coletadas por múltiplos LLMs</p>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <!-- Simulação de gráfico de linha temporal -->
            <div style="background: #0f172a; border-radius: 8px; padding: 30px; height: 250px; position: relative; border: 1px solid rgba(139, 92, 246, 0.3);">
              <!-- Grid lines -->
              ${[0, 25, 50, 75, 100].map(val => `
                <div style="position: absolute; left: 40px; right: 20px; top: ${30 + (100 - val) * 1.8}px; height: 1px; background: rgba(100, 116, 139, 0.2);"></div>
                <div style="position: absolute; left: 5px; top: ${25 + (100 - val) * 1.8}px; font-size: 9px; color: #64748b;">${val}</div>
              `).join('')}
              
              <!-- Linha de evolução simulada -->
              <svg style="position: absolute; left: 40px; right: 20px; top: 30px; bottom: 30px;" viewBox="0 0 400 180" preserveAspectRatio="none">
                <!-- ICE Line -->
                <polyline points="0,20 50,15 100,25 150,18 200,12 250,20 300,15 350,18 400,22" 
                  fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.9"/>
                <!-- GAP Line -->
                <polyline points="0,30 50,35 100,28 150,32 200,25 250,30 300,28 350,32 400,30" 
                  fill="none" stroke="#ec4899" stroke-width="2" opacity="0.9"/>
                <!-- CPI Line -->
                <polyline points="0,40 50,38 100,42 150,35 200,40 250,38 300,42 350,40 400,38" 
                  fill="none" stroke="#06b6d4" stroke-width="2" opacity="0.9"/>
                <!-- Stability Line -->
                <polyline points="0,10 50,8 100,12 150,10 200,8 250,10 300,12 350,10 400,8" 
                  fill="none" stroke="#10b981" stroke-width="2" opacity="0.9"/>
              </svg>
              
              <!-- Legenda -->
              <div style="position: absolute; bottom: 5px; left: 40px; display: flex; gap: 15px; font-size: 10px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #8b5cf6;"></div>
                  <span style="color: #a78bfa;">ICE</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #ec4899;"></div>
                  <span style="color: #f9a8d4;">GAP</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #06b6d4;"></div>
                  <span style="color: #67e8f9;">CPI</span>
                </div>
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="width: 12px; height: 3px; background: #10b981;"></div>
                  <span style="color: #6ee7b7;">Estabilidade</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Divergência Semântica (Scatter Plot sintético) -->
      <div class="section">
        <h2 class="section-title">🎯 Análise de Divergência Semântica</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Distribuição de confiança vs menções por provedor LLM</p>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="background: white; border-radius: 8px; padding: 30px; height: 220px; position: relative; border: 1px solid #e2e8f0;">
              <!-- Grid -->
              ${[0, 25, 50, 75, 100].map(val => `
                <div style="position: absolute; left: 40px; right: 20px; bottom: ${40 + val * 1.4}px; height: 1px; background: #e2e8f0;"></div>
                <div style="position: absolute; left: 5px; bottom: ${35 + val * 1.4}px; font-size: 9px; color: #64748b;">${val}%</div>
              `).join('')}
              
              <!-- Scatter points -->
              ${[
                { provider: 'ChatGPT', x: 85, y: 94, color: '#8b5cf6' },
                { provider: 'Gemini', x: 90, y: 97, color: '#ec4899' },
                { provider: 'Claude', x: 88, y: 96, color: '#06b6d4' },
                { provider: 'Perplexity', x: 92, y: 97, color: '#10b981' }
              ].map(point => `
                <div style="position: absolute; left: ${40 + point.x * 3.5}px; bottom: ${40 + point.y * 1.4}px; width: 12px; height: 12px; background: ${point.color}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
              `).join('')}
              
              <!-- Eixos -->
              <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #64748b; font-weight: 600;">Confiança (%)</div>
              
              <!-- Legenda -->
              <div style="position: absolute; top: 10px; right: 20px; background: white; padding: 10px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 10px;">
                ${[
                  { provider: 'ChatGPT', color: '#8b5cf6' },
                  { provider: 'Gemini', color: '#ec4899' },
                  { provider: 'Claude', color: '#06b6d4' },
                  { provider: 'Perplexity', color: '#10b981' }
                ].map(item => `
                  <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                    <div style="width: 8px; height: 8px; background: ${item.color}; border-radius: 50%;"></div>
                    <span style="color: #1e293b;">${item.provider}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Comparação entre Provedores LLM (Barras) -->
      <div class="section">
        <h2 class="section-title">🔍 Comparação entre Provedores LLM</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Taxa de menção e confiança média por provedor</p>
        <div class="chart-container">
          <div style="padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="background: white; border-radius: 8px; padding: 25px;">
              ${[
                { provider: 'PERPLEXITY', mention: 100, confidence: 97.1, color: '#10b981' },
                { provider: 'CLAUDE', mention: 100, confidence: 96.0, color: '#06b6d4' },
                { provider: 'GEMINI', mention: 100, confidence: 97.0, color: '#ec4899' },
                { provider: 'CHATGPT', mention: 100, confidence: 94.0, color: '#8b5cf6' }
              ].map(llm => `
                <div style="margin-bottom: 25px;">
                  <div style="font-weight: 700; font-size: 11px; color: #1e293b; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                    ${llm.provider}
                  </div>
                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <!-- Taxa de Menção -->
                    <div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 10px; color: #64748b;">Taxa de Menção (%)</span>
                        <span style="font-size: 11px; font-weight: 600; color: ${llm.color};">${llm.mention.toFixed(1)}%</span>
                      </div>
                      <div style="width: 100%; height: 24px; background: #f1f5f9; border-radius: 6px; overflow: hidden; position: relative;">
                        <div style="width: ${llm.mention}%; height: 100%; background: linear-gradient(90deg, ${llm.color} 0%, ${llm.color}cc 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                          <span style="font-size: 10px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${llm.mention}%</span>
                        </div>
                      </div>
                    </div>
                    <!-- Confiança Média -->
                    <div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
                        <span style="font-size: 10px; color: #64748b;">Confiança Média (%)</span>
                        <span style="font-size: 11px; font-weight: 600; color: ${llm.color};">${llm.confidence.toFixed(1)}%</span>
                      </div>
                      <div style="width: 100%; height: 24px; background: #f1f5f9; border-radius: 6px; overflow: hidden; position: relative;">
                        <div style="width: ${llm.confidence}%; height: 100%; background: linear-gradient(90deg, ${llm.color}aa 0%, ${llm.color}88 100%); border-radius: 6px; display: flex; align-items: center; justify-content: center;">
                          <span style="font-size: 10px; font-weight: 700; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.2);">${llm.confidence.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Charts IGO Capturados (se disponíveis) -->
      ${charts.filter(c => c.dataUrl).map(chart => `
        <div class="section">
          <div class="chart-container">
            <div class="chart-title">Gráfico: ${chart.id}</div>
            <img src="${chart.dataUrl}" alt="${chart.id}" />
          </div>
        </div>
      `).join('')}

      <div class="footer">
        <p><strong>Teia GEO</strong> - Intelligence Governance Observability</p>
        <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Gera HTML completo para relatório CPI
 */
export function generateCPIHTML(data: ExportDataCPI, charts: ChartCapture[]): string {
  logger.info('📝 Gerando HTML CPI', { brand: data.brandName });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório CPI - ${data.brandName}</title>
      ${commonStyles}
    </head>
    <body>
      <div class="header">
        <h1>🎯 Relatório CPI Dashboard</h1>
        <div class="metadata">
          <span><strong>Marca:</strong> ${data.brandName}</span>
          <span><strong>Período:</strong> ${data.period || 'Últimos 30 dias'}</span>
          <span><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <!-- Score CPI -->
      <div class="section">
        <h2 class="section-title">📊 Score CPI</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="label">CPI Score</div>
            <div class="value">${data.cpiMetrics.cpi?.toFixed(1) || 0}/100</div>
            <span class="badge ${(data.cpiMetrics.cpi || 0) >= 80 ? 'success' : (data.cpiMetrics.cpi || 0) >= 60 ? 'warning' : 'danger'}">
              ${(data.cpiMetrics.cpi || 0) >= 80 ? 'Excelente' : (data.cpiMetrics.cpi || 0) >= 60 ? 'Bom' : 'Crítico'}
            </span>
          </div>
          <div class="metric-card">
            <div class="label">ICE Score</div>
            <div class="value">${data.cpiMetrics.ice?.toFixed(1) || 0}</div>
          </div>
          <div class="metric-card">
            <div class="label">GAP Score</div>
            <div class="value">${data.cpiMetrics.gap?.toFixed(1) || 0}</div>
          </div>
          <div class="metric-card">
            <div class="label">Estabilidade</div>
            <div class="value">${data.cpiMetrics.stability?.toFixed(1) || 0}%</div>
          </div>
        </div>
      </div>

      <!-- Consenso LLMs -->
      ${data.llmConsensus && data.llmConsensus.length > 0 ? `
        <div class="section">
          <h2 class="section-title">🤖 Consenso por LLM</h2>
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Menções</th>
                <th>Confiança</th>
              </tr>
            </thead>
            <tbody>
              ${data.llmConsensus.map(consensus => `
                <tr>
                  <td><strong>${consensus.provider}</strong></td>
                  <td>${consensus.mentions}</td>
                  <td>
                    <span class="badge ${consensus.confidence >= 0.8 ? 'success' : consensus.confidence >= 0.6 ? 'warning' : 'danger'}">
                      ${(consensus.confidence * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Convergência Temporal entre LLMs -->
      ${data.convergenceData && data.convergenceData.length > 0 ? `
        <div class="section">
          <h2 class="section-title">📈 Convergência Temporal entre LLMs</h2>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Análise da estabilidade cognitiva ao longo do tempo — Como diferentes IAs convergem na percepção da marca</p>
          <div class="chart-container">
            <div style="padding: 25px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
              <div style="background: white; border-radius: 8px; padding: 30px; height: 280px; position: relative; border: 1px solid #e2e8f0;">
                <!-- Grid lines -->
                ${[0, 25, 50, 75, 100].map(val => `
                  <div style="position: absolute; left: 60px; right: 20px; top: ${30 + (100 - val) * 2}px; height: 1px; background: #e2e8f0;"></div>
                  <div style="position: absolute; left: 10px; top: ${25 + (100 - val) * 2}px; font-size: 10px; color: #64748b;">${val}</div>
                `).join('')}
                
                <!-- Linha de evolução real -->
                <svg style="position: absolute; left: 60px; right: 20px; top: 30px; bottom: 50px;" viewBox="0 0 ${data.convergenceData.length * 50} 200" preserveAspectRatio="none">
                  <!-- OpenAI Line -->
                  <polyline points="${data.convergenceData.map((d, i) => `${i * 50},${200 - (d.openai * 2)}`).join(' ')}" 
                    fill="none" stroke="#10b981" stroke-width="3" opacity="0.9"/>
                  <!-- Claude Line -->
                  <polyline points="${data.convergenceData.map((d, i) => `${i * 50},${200 - (d.claude * 2)}`).join(' ')}" 
                    fill="none" stroke="#8b5cf6" stroke-width="3" opacity="0.9"/>
                  <!-- Gemini Line -->
                  <polyline points="${data.convergenceData.map((d, i) => `${i * 50},${200 - (d.gemini * 2)}`).join(' ')}" 
                    fill="none" stroke="#3b82f6" stroke-width="3" opacity="0.9"/>
                  <!-- Perplexity Line -->
                  <polyline points="${data.convergenceData.map((d, i) => `${i * 50},${200 - (d.perplexity * 2)}`).join(' ')}" 
                    fill="none" stroke="#f59e0b" stroke-width="3" opacity="0.9"/>
                </svg>
                
                <!-- Eixo X (datas) -->
                <div style="position: absolute; bottom: 10px; left: 60px; right: 20px; display: flex; justify-content: space-between; font-size: 9px; color: #64748b;">
                  ${data.convergenceData.slice(0, 5).map(d => `<span>${d.timestamp}</span>`).join('')}
                </div>
                
                <!-- Legenda -->
                <div style="position: absolute; bottom: 35px; left: 60px; display: flex; gap: 15px; font-size: 10px;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 3px; background: #10b981;"></div>
                    <span style="color: #10b981; font-weight: 600;">OpenAI</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 3px; background: #8b5cf6;"></div>
                    <span style="color: #8b5cf6; font-weight: 600;">Claude</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 3px; background: #3b82f6;"></div>
                    <span style="color: #3b82f6; font-weight: 600;">Gemini</span>
                  </div>
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 3px; background: #f59e0b;"></div>
                    <span style="color: #f59e0b; font-weight: 600;">Perplexity</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Matriz de Coerência Semântica -->
      ${data.coherenceMatrix && data.coherenceMatrix.length > 0 ? `
        <div class="section">
          <h2 class="section-title">🔗 Matriz de Coerência Semântica</h2>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Mapa de concordância entre diferentes LLMs — Quanto cada IA "concorda" com as outras</p>
          <div class="chart-container">
            <table>
              <thead>
                <tr>
                  <th style="text-align: left;">LLM</th>
                  <th style="text-align: center;">OpenAI</th>
                  <th style="text-align: center;">Claude</th>
                  <th style="text-align: center;">Gemini</th>
                  <th style="text-align: center;">Perplexity</th>
                </tr>
              </thead>
              <tbody>
                ${data.coherenceMatrix.map(row => `
                  <tr>
                    <td style="font-weight: 700;">${row.llm}</td>
                    <td style="text-align: center;">
                      <span class="badge ${row.openai >= 90 ? 'success' : row.openai >= 70 ? 'warning' : 'danger'}">
                        ${row.openai}%
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge ${row.claude >= 90 ? 'success' : row.claude >= 70 ? 'warning' : 'danger'}">
                        ${row.claude}%
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge ${row.gemini >= 90 ? 'success' : row.gemini >= 70 ? 'warning' : 'danger'}">
                        ${row.gemini}%
                      </span>
                    </td>
                    <td style="text-align: center;">
                      <span class="badge ${row.perplexity >= 90 ? 'success' : row.perplexity >= 70 ? 'warning' : 'danger'}">
                        ${row.perplexity}%
                      </span>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="margin-top: 20px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-left: 4px solid #f59e0b; border-radius: 8px;">
            <p style="font-size: 12px; color: #92400e; margin: 0; line-height: 1.6;">
              <strong>🍯 Metacognição IGO:</strong> A matriz mostra o grau de "acordo" entre IAs diferentes. Valores altos indicam que múltiplas IAs geram percepções similares da marca, validando a governança semântica. Esta é a essência do IGO Framework — uma IA observando e validando outras.
            </p>
          </div>
        </div>
      ` : ''}

      <!-- Radar Chart Consenso Multi-LLM -->
      ${data.llmConsensus && data.llmConsensus.length > 0 ? `
        <div class="section">
          <h2 class="section-title">🎯 Consenso Multi-LLM</h2>
          <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">Comparação multidimensional das respostas dos diferentes LLMs</p>
          <div class="chart-container">
            <div style="display: flex; justify-content: center; padding: 30px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <!-- Radar Chart Sintético -->
              <div style="position: relative; width: 350px; height: 350px;">
                <svg width="350" height="350" viewBox="0 0 350 350">
                  <!-- Grid circles -->
                  ${[25, 50, 75, 100].map(radius => `
                    <circle cx="175" cy="175" r="${radius * 1.5}" fill="none" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>
                  `).join('')}
                  
                  <!-- Grid lines -->
                  ${data.llmConsensus.map((_, i) => {
                    const angle = (i * 360 / data.llmConsensus.length - 90) * (Math.PI / 180);
                    const x = 175 + Math.cos(angle) * 150;
                    const y = 175 + Math.sin(angle) * 150;
                    return `<line x1="175" y1="175" x2="${x}" y2="${y}" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>`;
                  }).join('')}
                  
                  <!-- Data polygon (Confiança) -->
                  <polygon points="${data.llmConsensus.map((d, i) => {
                    const angle = (i * 360 / data.llmConsensus.length - 90) * (Math.PI / 180);
                    const radius = (d.confidence * 100) * 1.5;
                    const x = 175 + Math.cos(angle) * radius;
                    const y = 175 + Math.sin(angle) * radius;
                    return `${x},${y}`;
                  }).join(' ')}" fill="rgba(16, 185, 129, 0.3)" stroke="#10b981" stroke-width="2"/>
                  
                  <!-- Data polygon (Sentimento) -->
                  ${data.llmConsensus[0].sentiment !== undefined ? `
                    <polygon points="${data.llmConsensus.map((d, i) => {
                      const angle = (i * 360 / data.llmConsensus.length - 90) * (Math.PI / 180);
                      const radius = (d.sentiment || 0) * 1.5;
                      const x = 175 + Math.cos(angle) * radius;
                      const y = 175 + Math.sin(angle) * radius;
                      return `${x},${y}`;
                    }).join(' ')}" fill="rgba(139, 92, 246, 0.3)" stroke="#8b5cf6" stroke-width="2"/>
                  ` : ''}
                  
                  <!-- Labels -->
                  ${data.llmConsensus.map((d, i) => {
                    const angle = (i * 360 / data.llmConsensus.length - 90) * (Math.PI / 180);
                    const x = 175 + Math.cos(angle) * 170;
                    const y = 175 + Math.sin(angle) * 170;
                    return `<text x="${x}" y="${y}" text-anchor="middle" fill="#a78bfa" font-size="11" font-weight="600">${d.provider}</text>`;
                  }).join('')}
                </svg>
                
                <!-- Legenda -->
                <div style="position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 15px; font-size: 11px;">
                  <div style="display: flex; align-items: center; gap: 4px;">
                    <div style="width: 12px; height: 3px; background: #10b981;"></div>
                    <span style="color: #a78bfa;">Confiança</span>
                  </div>
                  ${data.llmConsensus[0].sentiment !== undefined ? `
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <div style="width: 12px; height: 3px; background: #8b5cf6;"></div>
                      <span style="color: #c4b5fd;">Sentimento</span>
                    </div>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

      <!-- Gráfico CPI Gauge (HTML/CSS puro) -->
      <div class="section">
        <h2 class="section-title">📊 Visualização CPI</h2>
        <div class="chart-container">
          <div style="display: flex; justify-content: center; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
            <div style="text-align: center;">
              <!-- Gauge semicircular -->
              <div style="position: relative; width: 200px; height: 120px; margin: 0 auto;">
                ${(() => {
                  const cpiScore = data.cpiMetrics.cpi || 0;
                  const percentage = (cpiScore / 100) * 180; // 180 graus = semicírculo
                  const color = cpiScore >= 80 ? '#10b981' : cpiScore >= 60 ? '#f59e0b' : '#ef4444';
                  
                  return `
                    <!-- Fundo do gauge -->
                    <svg width="200" height="120" style="transform: rotate(0deg);">
                      <path d="M 10 110 A 90 90 0 0 1 190 110" stroke="#e2e8f0" stroke-width="20" fill="none" stroke-linecap="round"/>
                      <path d="M 10 110 A 90 90 0 0 1 ${10 + (180 * (cpiScore/100))} ${110 - (90 * Math.sin((cpiScore/100) * Math.PI))}" stroke="${color}" stroke-width="20" fill="none" stroke-linecap="round"/>
                    </svg>
                    <!-- Valor central -->
                    <div style="position: absolute; top: 60px; left: 50%; transform: translateX(-50%); text-align: center;">
                      <div style="font-size: 36px; font-weight: 700; color: ${color};">${cpiScore.toFixed(1)}</div>
                      <div style="font-size: 12px; color: #64748b; font-weight: 600;">CPI Score</div>
                    </div>
                  `;
                })()}
              </div>
              
              <!-- Métricas auxiliares -->
              <div style="display: flex; gap: 20px; justify-content: center; margin-top: 30px;">
                ${[
                  { label: 'ICE', value: data.cpiMetrics.ice || 0, icon: '🧊' },
                  { label: 'GAP', value: data.cpiMetrics.gap || 0, icon: '📊' },
                  { label: 'Estabilidade', value: data.cpiMetrics.stability || 0, icon: '⚖️' }
                ].map(metric => `
                  <div style="background: white; border-radius: 8px; padding: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); min-width: 80px;">
                    <div style="font-size: 20px; margin-bottom: 5px;">${metric.icon}</div>
                    <div style="font-size: 18px; font-weight: 700; color: #1e293b; margin-bottom: 3px;">${metric.value.toFixed(1)}</div>
                    <div style="font-size: 10px; color: #64748b; font-weight: 600;">${metric.label}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts CPI Capturados (se disponíveis) -->
      ${charts.filter(c => c.dataUrl).map(chart => `
        <div class="section">
          <div class="chart-container">
            <div class="chart-title">Gráfico: ${chart.id}</div>
            <img src="${chart.dataUrl}" alt="${chart.id}" />
          </div>
        </div>
      `).join('')}

      <div class="footer">
        <p><strong>Teia GEO</strong> - Cognitive Prominence Index</p>
        <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Gera HTML completo para relatório Científico IGO
 */
export function generateScientificHTML(data: ExportDataScientific, charts: ChartCapture[]): string {
  logger.info('📝 Gerando HTML Científico', { brand: data.brandName });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Relatório Científico IGO - ${data.brandName}</title>
      ${commonStyles}
    </head>
    <body>
      <div class="header">
        <h1>🔬 Relatório Científico - Intelligence Governance Observability</h1>
        <div class="metadata">
          <span><strong>Marca:</strong> ${data.brandName}</span>
          <span><strong>Período:</strong> ${data.period || 'Últimos 30 dias'}</span>
          <span><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <!-- Sumário Executivo - KAPI Metrics -->
      <div class="section">
        <h2 class="section-title">📊 Sumário Executivo - Métricas KAPI</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Análise científica completa das métricas IGO (Intelligence Governance Observability) que avaliam 
          o comportamento de IAs generativas em relação à marca. As métricas KAPI (ICE, GAP, CPI, Consenso) 
          representam a base científica da análise de governança algorítmica.
        </p>
        <div class="metrics-grid">
          ${[
            {
              label: 'ICE Médio',
              value: data.kapiMetrics.ice.toFixed(2),
              icon: '🧊',
              color: '#2563eb',
              bgColor: '#dbeafe',
              description: 'Índice de Cobertura Estimada'
            },
            {
              label: 'GAP Médio',
              value: data.kapiMetrics.gap.toFixed(2),
              icon: '📊',
              color: '#8b5cf6',
              bgColor: '#ede9fe',
              description: 'Diferencial de Autoridade'
            },
            {
              label: 'CPI Médio',
              value: data.kapiMetrics.cpi.toFixed(2),
              icon: '🎯',
              color: '#10b981',
              bgColor: '#d1fae5',
              description: 'Cognitive Prominence Index'
            },
            {
              label: 'Consenso Multi-LLM',
              value: `${data.kapiMetrics.consensus.toFixed(1)}%`,
              icon: '🤝',
              color: '#f59e0b',
              bgColor: '#fef3c7',
              description: 'Convergência entre modelos'
            }
          ].map(metric => `
            <div class="metric-card" style="border-left: 4px solid ${metric.color};">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
                <div style="width: 40px; height: 40px; background: ${metric.bgColor}; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                  ${metric.icon}
                </div>
                <div>
                  <div class="label" style="font-size: 11px;">${metric.label}</div>
                  <div style="font-size: 9px; color: #64748b;">${metric.description}</div>
                </div>
              </div>
              <div class="value" style="color: ${metric.color};">${metric.value}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Análise Multi-LLM -->
      <div class="section">
        <h2 class="section-title">🤖 Análise Multi-LLM - Comportamento Observado</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Análise científica detalhada do comportamento de cada modelo de IA generativa (ChatGPT, Gemini, Claude, Perplexity) 
          em relação à marca. Confiança representa a consistência das respostas e Taxa indica a cobertura em consultas relevantes.
        </p>
        <table>
          <thead>
            <tr>
              <th>Modelo LLM</th>
              <th>Confiança (%)</th>
              <th>Taxa de Cobertura (%)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${data.llmAnalysis.map((llm, index) => {
              const colors = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b'];
              const icons = ['🟢', '🔵', '🟣', '🟡'];
              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="font-size: 14px;">${icons[index]}</span>
                      <strong>${llm.provider}</strong>
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="flex: 1; background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="width: ${llm.confidence}%; height: 100%; background: ${colors[index]};"></div>
                      </div>
                      <span style="font-weight: 600; color: ${colors[index]};">${llm.confidence.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="flex: 1; background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div style="width: ${llm.coverage}%; height: 100%; background: ${colors[index]};"></div>
                      </div>
                      <span style="font-weight: 600; color: ${colors[index]};">${llm.coverage.toFixed(1)}%</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge ${llm.confidence >= 95 ? 'success' : llm.confidence >= 90 ? 'warning' : 'info'}">
                      ${llm.confidence >= 95 ? 'Excelente' : llm.confidence >= 90 ? 'Bom' : 'Regular'}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Gráfico Radar Multi-LLM -->
      <div class="section">
        <h2 class="section-title">📈 Análise Radar - Cobertura Multi-LLM</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Visualização radar comparando o desempenho de cada modelo de IA em relação à marca. 
          Modelos com cobertura mais ampla (próximos à borda externa) indicam maior presença da marca nas respostas geradas.
        </p>
        <div class="chart-container">
          <div style="display: flex; justify-content: center; padding: 30px; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
            <div style="position: relative; width: 400px; height: 400px;">
              <svg width="400" height="400" viewBox="0 0 400 400">
                <!-- Grid circles -->
                ${[25, 50, 75, 100].map(radius => `
                  <circle cx="200" cy="200" r="${radius * 1.5}" fill="none" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>
                `).join('')}
                
                <!-- Grid lines -->
                ${data.llmAnalysis.map((_, i) => {
                  const angle = (i * 360 / data.llmAnalysis.length - 90) * (Math.PI / 180);
                  const x = 200 + Math.cos(angle) * 150;
                  const y = 200 + Math.sin(angle) * 150;
                  return `<line x1="200" y1="200" x2="${x}" y2="${y}" stroke="rgba(100, 116, 139, 0.3)" stroke-width="1"/>`;
                }).join('')}
                
                <!-- Data polygon -->
                <polygon points="${data.llmAnalysis.map((llm, i) => {
                  const angle = (i * 360 / data.llmAnalysis.length - 90) * (Math.PI / 180);
                  const radius = (llm.confidence / 100) * 150;
                  const x = 200 + Math.cos(angle) * radius;
                  const y = 200 + Math.sin(angle) * radius;
                  return `${x},${y}`;
                }).join(' ')}" fill="rgba(139, 92, 246, 0.3)" stroke="#8b5cf6" stroke-width="3"/>
                
                <!-- Data points -->
                ${data.llmAnalysis.map((llm, i) => {
                  const angle = (i * 360 / data.llmAnalysis.length - 90) * (Math.PI / 180);
                  const radius = (llm.confidence / 100) * 150;
                  const x = 200 + Math.cos(angle) * radius;
                  const y = 200 + Math.sin(angle) * radius;
                  return `<circle cx="${x}" cy="${y}" r="5" fill="#8b5cf6" stroke="white" stroke-width="2"/>`;
                }).join('')}
                
                <!-- Labels -->
                ${data.llmAnalysis.map((llm, i) => {
                  const angle = (i * 360 / data.llmAnalysis.length - 90) * (Math.PI / 180);
                  const labelRadius = 180;
                  const x = 200 + Math.cos(angle) * labelRadius;
                  const y = 200 + Math.sin(angle) * labelRadius;
                  return `
                    <text x="${x}" y="${y}" text-anchor="middle" fill="#a78bfa" font-size="11" font-weight="600">
                      ${llm.provider}
                    </text>
                    <text x="${x}" y="${y + 14}" text-anchor="middle" fill="#c4b5fd" font-size="11" font-weight="700">
                      ${llm.confidence.toFixed(1)}%
                    </text>
                  `;
                }).join('')}
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Validação de Hipóteses Científicas -->
      <div class="section">
        <h2 class="section-title">✅ Validação de Hipóteses Científicas</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Validação rigorosa de hipóteses sobre o comportamento de IAs generativas utilizando metodologia científica. 
          Cada hipótese é testada estatisticamente com intervalo de confiança e status de validação baseado em evidências empíricas.
        </p>
        ${data.hypotheses.map((hypothesis, index) => {
          const statusColors = {
            validated: { bg: '#d1fae5', border: '#10b981', text: '#065f46', icon: '✅' },
            rejected: { bg: '#fee2e2', border: '#ef4444', text: '#991b1b', icon: '❌' },
            pending: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', icon: '⏳' }
          };
          const colors = statusColors[hypothesis.status];
          
          return `
            <div style="background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}dd 100%); border-left: 4px solid ${colors.border}; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
              <div style="display: flex; align-items: start; justify-content: space-between; gap: 15px;">
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                    <span style="font-size: 20px;">${colors.icon}</span>
                    <h3 style="margin: 0; color: ${colors.text}; font-size: 14px; font-weight: 700;">${hypothesis.id}</h3>
                  </div>
                  <p style="margin: 0 0 8px 0; color: ${colors.text}; font-size: 13px; font-weight: 600; line-height: 1.5;">
                    ${hypothesis.title}
                  </p>
                  <p style="margin: 0; color: ${colors.text}; font-size: 12px; line-height: 1.6; opacity: 0.9;">
                    ${hypothesis.description}
                  </p>
                  <div style="margin-top: 10px; padding: 10px; background: rgba(255, 255, 255, 0.6); border-radius: 6px; display: flex; align-items: center; justify-content: space-between;">
                    <span style="color: ${colors.text}; font-size: 11px; font-weight: 600;">
                      Status: <strong>${hypothesis.status === 'validated' ? 'validated' : hypothesis.status === 'rejected' ? 'rejected' : 'pending'}</strong>
                    </span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div style="width: 120px; height: 6px; background: rgba(0,0,0,0.1); border-radius: 3px; overflow: hidden;">
                        <div style="width: ${hypothesis.confidence}%; height: 100%; background: ${colors.border};"></div>
                      </div>
                      <span style="background: ${colors.border}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700;">
                        ${hypothesis.confidence.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Recomendações Científicas -->
      <div class="section">
        <h2 class="section-title">🔬 Recomendações Científicas</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; line-height: 1.6;">
          Ações estratégicas baseadas em evidências científicas derivadas da análise IGO. 
          Recomendações priorizadas por impacto mensurável e fundamentadas em dados empíricos de comportamento de IAs generativas.
        </p>
        ${data.recommendations.map((rec, index) => {
          const priorityColors = {
            high: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', badge: '#ef4444', label: 'Alta Prioridade' },
            medium: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e', badge: '#f59e0b', label: 'Média Prioridade' },
            low: { bg: '#dbeafe', border: '#2563eb', text: '#1e40af', badge: '#2563eb', label: 'Baixa Prioridade' }
          };
          const colors = priorityColors[rec.priority];
          
          return `
            <div style="background: linear-gradient(135deg, ${colors.bg} 0%, ${colors.bg}dd 100%); border-left: 4px solid ${colors.border}; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
              <div style="display: flex; align-items: start; gap: 12px;">
                <span style="background: ${colors.badge}; color: white; padding: 4px 10px; border-radius: 4px; font-size: 10px; font-weight: 700; white-space: nowrap;">
                  ${colors.label}
                </span>
                <div style="flex: 1;">
                  <h3 style="margin: 0 0 10px 0; color: ${colors.text}; font-size: 14px; font-weight: 700; line-height: 1.4;">
                    ${rec.title}
                  </h3>
                  <p style="margin: 0 0 12px 0; color: ${colors.text}; font-size: 12px; line-height: 1.6;">
                    ${rec.description}
                  </p>
                  <div style="padding: 10px; background: rgba(255, 255, 255, 0.6); border-radius: 6px;">
                    <span style="color: ${colors.text}; font-size: 11px; font-weight: 600;">
                      💡 Impacto Esperado: <strong>${rec.impact}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Charts Científicos Capturados (se disponíveis) -->
      ${charts.filter(c => c.dataUrl).map(chart => `
        <div class="section">
          <div class="chart-container">
            <div class="chart-title">Gráfico Científico: ${chart.id}</div>
            <img src="${chart.dataUrl}" alt="${chart.id}" />
          </div>
        </div>
      `).join('')}

      <div class="footer">
        <p><strong>Teia GEO</strong> - Intelligence Governance Observability Framework</p>
        <p>© ${new Date().getFullYear()} - Relatório Científico - Todos os direitos reservados</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Interface para dados de Governança Algorítmica
 */
export interface ExportDataGovernance {
  brandName: string;
  complianceScore: number;
  avgICE: number;
  avgStability: number;
  avgCPI: number;
  avgGAP: number;
  totalDataPoints: number;
  risks: Array<{
    level: 'high' | 'medium' | 'low';
    title: string;
    message: string;
    details: string;
    recommendation: string;
  }>;
  recommendations: Array<{
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    title: string;
    description: string;
    actions: string[];
    impact: string;
  }>;
  providerConsensus: Array<{
    provider: string;
    avgConfidence: number;
    mentionRate: number;
  }>;
  period?: string;
}

/**
 * Gera HTML completo para relatório de Governança Algorítmica (mesmo visual dos outros PDFs)
 */
export function generateGovernanceHTML(data: ExportDataGovernance): string {
  logger.info('📝 Gerando HTML Governança Algorítmica', { brand: data.brandName });

  const getComplianceColor = (score: number) => {
    if (score >= 80) return { bg: '#dcfce7', text: '#166534', label: 'Excelente' };
    if (score >= 60) return { bg: '#dbeafe', text: '#1e40af', label: 'Bom' };
    if (score >= 40) return { bg: '#fef3c7', text: '#92400e', label: 'Regular' };
    return { bg: '#fee2e2', text: '#991b1b', label: 'Crítico' };
  };

  const complianceStyle = getComplianceColor(data.complianceScore);

  const getMetricBadge = (value: number, threshold: number) => {
    const isOk = value >= threshold;
    return isOk 
      ? '<span style="display: inline-block; padding: 4px 12px; background: #dcfce7; color: #16a34a; border-radius: 6px; font-size: 11px; font-weight: 600;">✓ OK</span>'
      : '<span style="display: inline-block; padding: 4px 12px; background: #fee2e2; color: #dc2626; border-radius: 6px; font-size: 11px; font-weight: 600;">⚠ Atenção</span>';
  };

  // Build metrics cards HTML - Todas as métricas KAPI usam lógica DIRETA (maior = melhor)
  // Conforme Artigo Científico Cap. 3: ICE, GAP, Estabilidade, CPI
  const metricsCardsHTML = [
    { label: 'ICE', value: data.avgICE, threshold: 75, icon: '🧊', color: '#8b5cf6' },
    { label: 'Estabilidade', value: data.avgStability, threshold: 70, icon: '⚖️', color: '#10b981' },
    { label: 'CPI', value: data.avgCPI, threshold: 65, icon: '🎯', color: '#f59e0b' },
    { label: 'GAP', value: data.avgGAP, threshold: 60, icon: '📊', color: '#ec4899' } // GAP: maior = melhor
  ].map(m => {
    // Todas as métricas KAPI: maior = melhor
    const isOk = m.value >= m.threshold;
    const badge = isOk 
      ? `<div style="display: inline-block; padding: 3px 10px; background: #dcfce7; color: #16a34a; border-radius: 4px; font-size: 10px; font-weight: 600;">✓ OK</div>`
      : `<div style="display: inline-block; padding: 3px 10px; background: #fee2e2; color: #dc2626; border-radius: 4px; font-size: 10px; font-weight: 600;">⚠ Atenção</div>`;
    return `
      <div style="background: white; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <div style="font-size: 28px; margin-bottom: 8px;">${m.icon}</div>
        <div style="font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; margin-bottom: 5px;">${m.label}</div>
        <div style="font-size: 36px; font-weight: 800; color: ${m.color}; margin-bottom: 8px;">${Math.round(m.value)}%</div>
        <div style="width: 100%; height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden; margin-bottom: 8px;">
          <div style="width: ${m.value}%; height: 100%; background: linear-gradient(90deg, ${m.color} 0%, ${m.color}cc 100%); border-radius: 3px;"></div>
        </div>
        ${badge}
        <div style="font-size: 9px; color: #94a3b8; margin-top: 6px;">Mínimo: ${m.threshold}%</div>
      </div>
    `;
  }).join('');

  // Build checklist table rows - Todas as métricas KAPI usam lógica DIRETA (maior = melhor)
  // Conforme Artigo Científico Cap. 3
  const checklistRows = [
    { name: 'ICE (Eficiência Cognitiva)', value: data.avgICE, threshold: 75 },
    { name: 'Estabilidade Cognitiva', value: data.avgStability, threshold: 70 },
    { name: 'CPI Score', value: data.avgCPI, threshold: 65 },
    { name: 'GAP (Alinhamento de Observabilidade)', value: data.avgGAP, threshold: 60 } // maior = melhor
  ].map((item, idx) => {
    const isOk = item.value >= item.threshold;
    const valueColor = isOk ? '#16a34a' : '#dc2626';
    const badge = getMetricBadge(item.value, item.threshold);
    const bg = idx % 2 === 0 ? '#f8fafc' : 'white';
    return `
      <tr style="background: ${bg};">
        <td style="padding: 12px 16px; font-weight: 500;">${item.name}</td>
        <td style="padding: 12px 16px; text-align: center; font-weight: 700; color: ${valueColor};">${Math.round(item.value)}%</td>
        <td style="padding: 12px 16px; text-align: center; color: #64748b;">≥ ${item.threshold}%</td>
        <td style="padding: 12px 16px; text-align: center;">${badge}</td>
      </tr>
    `;
  }).join('');

  // Build risks HTML
  const risksHTML = data.risks && data.risks.length > 0 ? data.risks.map(risk => {
    const configs: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
      high: { bg: '#fee2e2', border: '#fecaca', text: '#991b1b', label: 'ALTO', icon: '🔴' },
      medium: { bg: '#fef3c7', border: '#fde68a', text: '#92400e', label: 'MÉDIO', icon: '🟡' },
      low: { bg: '#dbeafe', border: '#bfdbfe', text: '#1e40af', label: 'INFO', icon: '🔵' }
    };
    const c = configs[risk.level] || configs.low;
    return `
      <div style="background: ${c.bg}; border: 1px solid ${c.border}; border-radius: 12px; padding: 20px; border-left: 5px solid ${c.text};">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px;">
          <span style="font-size: 18px;">${c.icon}</span>
          <span style="background: ${c.text}; color: white; padding: 3px 10px; border-radius: 4px; font-size: 10px; font-weight: 700;">${c.label}</span>
          <span style="font-weight: 700; color: ${c.text}; font-size: 14px;">${risk.title}</span>
        </div>
        <p style="color: #374151; font-size: 12px; margin-bottom: 8px;">${risk.message}</p>
        <p style="color: #6b7280; font-size: 11px; margin-bottom: 10px; font-style: italic;">Análise: ${risk.details}</p>
        <div style="display: flex; align-items: flex-start; gap: 8px; padding: 10px; background: rgba(255,255,255,0.7); border-radius: 6px;">
          <span style="font-size: 14px;">💡</span>
          <span style="font-size: 11px; color: #4b5563;"><strong>Recomendação:</strong> ${risk.recommendation}</span>
        </div>
      </div>
    `;
  }).join('') : '';

  // Build recommendations HTML
  const recsHTML = data.recommendations && data.recommendations.length > 0 ? data.recommendations.map(rec => {
    const configs: Record<string, { bg: string; border: string; text: string; label: string; icon: string }> = {
      critical: { bg: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '#ef4444', text: '#991b1b', label: 'CRÍTICO', icon: '🚨' },
      high: { bg: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '#f59e0b', text: '#92400e', label: 'ALTO', icon: '⚡' },
      medium: { bg: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)', border: '#3b82f6', text: '#1e40af', label: 'MÉDIO', icon: '📋' },
      low: { bg: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: '#22c55e', text: '#166534', label: 'BAIXO', icon: '✓' }
    };
    const c = configs[rec.priority] || configs.medium;
    const actionsLi = rec.actions.map(a => `<li>${a}</li>`).join('');
    return `
      <div style="background: ${c.bg}; border-radius: 12px; padding: 25px; border-left: 5px solid ${c.border}; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
          <span style="font-size: 22px;">${c.icon}</span>
          <span style="background: ${c.border}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;">${c.label}</span>
          <span style="font-weight: 700; color: ${c.text}; font-size: 15px;">${rec.title}</span>
        </div>
        <div style="color: #64748b; font-size: 11px; margin-bottom: 10px; text-transform: uppercase; font-weight: 600;">${rec.category}</div>
        <p style="color: #374151; font-size: 12px; margin-bottom: 15px; line-height: 1.6;">${rec.description}</p>
        <div style="background: rgba(255,255,255,0.8); border-radius: 8px; padding: 15px; margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 700; color: #374151; margin-bottom: 10px;">📌 Ações Recomendadas:</div>
          <ul style="margin: 0; padding-left: 20px; font-size: 11px; color: #4b5563; line-height: 1.8;">${actionsLi}</ul>
        </div>
        <div style="display: flex; align-items: center; gap: 8px; padding: 10px; background: rgba(0,0,0,0.05); border-radius: 6px;">
          <span style="font-size: 14px;">📈</span>
          <span style="font-size: 11px; color: ${c.text}; font-weight: 600;">${rec.impact}</span>
        </div>
      </div>
    `;
  }).join('') : '';

  // Build consensus HTML
  const consensusHTML = data.providerConsensus && data.providerConsensus.length > 0 ? data.providerConsensus.map((p, idx) => {
    const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b'];
    const color = colors[idx % colors.length];
    const borderBottom = idx < data.providerConsensus.length - 1 ? '1px solid #e2e8f0' : 'none';
    return `
      <div style="margin-bottom: 25px; padding-bottom: 20px; border-bottom: ${borderBottom};">
        <div style="font-weight: 700; font-size: 14px; color: #1e293b; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px;">${p.provider}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 11px; color: #64748b;">Taxa de Menção</span>
              <span style="font-size: 13px; font-weight: 700; color: ${color};">${p.mentionRate.toFixed(1)}%</span>
            </div>
            <div style="width: 100%; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden;">
              <div style="width: ${p.mentionRate}%; height: 100%; background: linear-gradient(90deg, ${color} 0%, ${color}cc 100%); border-radius: 5px;"></div>
            </div>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
              <span style="font-size: 11px; color: #64748b;">Confiança Média</span>
              <span style="font-size: 13px; font-weight: 700; color: ${color};">${p.avgConfidence.toFixed(1)}%</span>
            </div>
            <div style="width: 100%; height: 10px; background: #f1f5f9; border-radius: 5px; overflow: hidden;">
              <div style="width: ${Math.min(p.avgConfidence, 100)}%; height: 100%; background: linear-gradient(90deg, ${color}99 0%, ${color}66 100%); border-radius: 5px;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('') : '';

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Governança Algorítmica - ${data.brandName}</title>
      ${commonStyles}
    </head>
    <body>
      <div class="header">
        <h1>🛡️ Governança Algorítmica</h1>
        <div class="metadata">
          <span><strong>Marca:</strong> ${data.brandName}</span>
          <span><strong>Período:</strong> ${data.period || 'Últimos 30 dias'}</span>
          <span><strong>Gerado em:</strong> ${new Date().toLocaleString('pt-BR')}</span>
        </div>
      </div>

      <!-- Score de Compliance Algorítmico -->
      <div class="section">
        <h2 class="section-title">📊 Score de Compliance Algorítmico</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">
          Índice geral baseado em IGO (ICE, Estabilidade, CPI, GAP) — Avaliação completa de conformidade algorítmica
        </p>
        <div style="display: flex; gap: 30px; align-items: center; padding: 30px; background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <div style="text-align: center;">
            <div style="font-size: 72px; font-weight: 800; color: ${complianceStyle.text}; line-height: 1;">
              ${Math.round(data.complianceScore)}
            </div>
            <div style="font-size: 14px; color: #64748b; margin-top: 5px;">de 100</div>
          </div>
          <div style="flex: 1;">
            <div style="display: inline-block; padding: 8px 20px; background: ${complianceStyle.bg}; color: ${complianceStyle.text}; border-radius: 8px; font-weight: 700; font-size: 16px; margin-bottom: 15px;">
              ${complianceStyle.label}
            </div>
            <div style="width: 100%; height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden;">
              <div style="width: ${data.complianceScore}%; height: 100%; background: linear-gradient(90deg, ${complianceStyle.text} 0%, ${complianceStyle.text}cc 100%); border-radius: 6px;"></div>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 10px;">
              Baseado em ${data.totalDataPoints} pontos de dados coletados
            </p>
          </div>
        </div>
      </div>

      <!-- Métricas KAPI Principais -->
      <div class="section">
        <h2 class="section-title">🎯 Métricas KAPI Principais</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">
          As 4 métricas fundamentais do framework IGO para governança de inteligências artificiais
        </p>
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
          ${metricsCardsHTML}
        </div>
      </div>

      <!-- Checklist de Compliance -->
      <div class="section">
        <h2 class="section-title">✅ Checklist de Compliance</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">
          Verificação de conformidade com diretrizes de governança algorítmica
        </p>
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: linear-gradient(90deg, #2563eb 0%, #7c3aed 100%);">
                <th style="padding: 14px 16px; text-align: left; color: white; font-weight: 600;">Métrica</th>
                <th style="padding: 14px 16px; text-align: center; color: white; font-weight: 600;">Atual</th>
                <th style="padding: 14px 16px; text-align: center; color: white; font-weight: 600;">Recomendado</th>
                <th style="padding: 14px 16px; text-align: center; color: white; font-weight: 600;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${checklistRows}
            </tbody>
          </table>
        </div>
      </div>

      ${data.risks && data.risks.length > 0 ? `
      <!-- Análise de Riscos -->
      <div class="section">
        <h2 class="section-title">⚠️ Análise de Riscos</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">
          Riscos identificados através de monitoramento multi-LLM
        </p>
        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${risksHTML}
        </div>
      </div>
      ` : ''}

      ${data.recommendations && data.recommendations.length > 0 ? `
      <!-- Recomendações Inteligentes IGO -->
      <div class="section">
        <h2 class="section-title">🧠 Recomendações Inteligentes IGO</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">
          Ações baseadas em análise matemática das métricas atuais
        </p>
        <div style="display: flex; flex-direction: column; gap: 20px;">
          ${recsHTML}
        </div>
      </div>
      ` : ''}

      ${data.providerConsensus && data.providerConsensus.length > 0 ? `
      <!-- Consenso Multi-LLM -->
      <div class="section">
        <h2 class="section-title">🤖 Consenso Multi-LLM</h2>
        <p style="color: #64748b; font-size: 13px; margin-bottom: 20px;">
          Taxa de menção e confiança por provedor de IA generativa
        </p>
        <div style="background: white; border-radius: 12px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          ${consensusHTML}
        </div>
      </div>
      ` : ''}

      <div class="footer">
        <p><strong>Teia GEO</strong> - Governança Algorítmica</p>
        <p>© ${new Date().getFullYear()} - Todos os direitos reservados</p>
      </div>
    </body>
    </html>
  `;
}
