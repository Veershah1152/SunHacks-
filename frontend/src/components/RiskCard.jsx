import React from 'react';
import { useTranslation } from 'react-i18next';

const RISK_CONFIG = (t) => ({
  HIGH:   { cls: 'high',   label: t('risk.high')   },
  MEDIUM: { cls: 'medium', label: t('risk.medium') },
  LOW:    { cls: 'low',    label: t('risk.low')    },
});

const RiskCard = React.memo(function RiskCard({ result, loading }) {
  const { t } = useTranslation();
  if (loading || !result) return null;

  const config = RISK_CONFIG(t);
  const cfg = config[result.risk] || config.MEDIUM;
  const confidence = Math.round((result.confidence ?? 0.5) * 100);
  const riskVal = result?.risk_numerical ?? 50;

  return (
    <div className={`intel-card accent-${cfg.cls}`}>
      <div className="card-label">{t('intel.risk_assessment')}</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '24px 0' }}>
        <div 
          className={loading ? "skeleton" : "crt-flicker"}
          style={{ fontSize: '4rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1, marginBottom: '12px', color: 'white' }}
        >
          {riskVal}
        </div>
        <div className={`risk-badge ${cfg.cls}`}>
          {cfg.label}
        </div>
      </div>

      <div className="conf-bar-wrap">
        <div className="conf-label">
          <span>{t('intel.confidence_score')}</span>
          <span>{confidence}%</span>
        </div>
        <div className="conf-bar">
          <div className="conf-fill" style={{ width: `${confidence}%` }} />
        </div>
      </div>
    </div>
  );
});

export default RiskCard;
