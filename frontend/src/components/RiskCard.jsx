import React from 'react';

const RISK_CONFIG = {
  HIGH:   { cls: 'high',   label: 'HIGH RISK'   },
  MEDIUM: { cls: 'medium', label: 'MEDIUM RISK' },
  LOW:    { cls: 'low',    label: 'LOW RISK'    },
}

export default function RiskCard({ result, loading }) {
  if (loading || !result) return null;

  const cfg = RISK_CONFIG[result.risk] || RISK_CONFIG.MEDIUM;
  const confidence = Math.round((result.confidence ?? 0.5) * 100);
  const riskVal = result?.risk_numerical ?? 50;

  return (
    <div className={`intel-card accent-${cfg.cls}`}>
      <div className="card-label">Risk Assessment</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
        <div style={{ fontSize: '4rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '12px' }}>
          {riskVal}
        </div>
        <div className={`risk-badge ${cfg.cls}`}>
          {cfg.label}
        </div>
      </div>

      <div className="conf-bar-wrap">
        <div className="conf-label">
          <span>PIPELINE CONFIDENCE</span>
          <span>{confidence}%</span>
        </div>
        <div className="conf-bar">
          <div className="conf-fill" style={{ width: `${confidence}%` }} />
        </div>
      </div>
    </div>
  );
}
