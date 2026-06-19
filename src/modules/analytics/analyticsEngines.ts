import type { Anomaly } from './businessTypes';

export function detectAnomalies(prevLeads: number, curLeads: number, prevConv: number, curConv: number): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (prevLeads > 0 && curLeads < prevLeads * 0.6) {
    anomalies.push({
      id: 'an1',
      metric: 'Lead量',
      change: `下降${Math.round((1 - curLeads / Math.max(prevLeads, 1)) * 100)}%`,
      direction: 'down',
      severity: 'warning',
      alert: 'Lead generation dropped significantly this week.',
    });
  }
  if (prevConv > 0 && curConv < prevConv * 0.5) {
    anomalies.push({
      id: 'an2',
      metric: '转化率',
      change: `下降${Math.round((1 - curConv / Math.max(prevConv, 1)) * 100)}%`,
      direction: 'down',
      severity: 'critical',
      alert: 'Conversion rate has dropped. Check funnel.',
    });
  }
  return anomalies;
}
