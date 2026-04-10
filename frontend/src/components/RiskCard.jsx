import React from 'react';

const RISK_CONFIG = {
  HIGH:   { color: '#c31e00', icon: '🔴', label: 'HIGH RISK'   },
  MEDIUM: { color: '#ffa000', icon: '🟠', label: 'MEDIUM RISK' },
  LOW:    { color: '#00de72', icon: '🟢', label: 'LOW RISK'    },
}

function SkeletonBlock({ h = '20px', w = '100%', mb = '0' }) {
  return (
    <div className="skeleton" style={{ height: h, width: w, marginBottom: mb, borderRadius: '6px' }} />
  )
}

export default function RiskCard({ result, loading }) {
  const cfg = result ? (RISK_CONFIG[result.risk] || RISK_CONFIG.MEDIUM) : RISK_CONFIG.MEDIUM
  const confidence = result ? Math.round((result.confidence ?? 0.5) * 100) : 0
  const riskVal = result?.risk_numerical ?? 50
  const trajectory = result?.trajectory || 'STABLE'

  const getTrajectoryColor = (t) => {
    if (t.includes('ESCALATING')) return '#c31e00'
    if (t.includes('STABLE')) return '#00d2ff'
    return '#00de72'
  }

  return (
    <div className="kinetic-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
          TACTICAL ASSESSMENT
        </span>
        {!loading && result && (
          <span style={{ 
            fontSize: '0.7rem', 
            background: `${getTrajectoryColor(trajectory)}22`, 
            color: getTrajectoryColor(trajectory),
            padding: '2px 8px',
            borderRadius: '4px',
            border: `1px solid ${getTrajectoryColor(trajectory)}44`,
            fontWeight: 700
          }}>
            {trajectory}
          </span>
        )}
      </div>

      {loading ? (
        <>
          <SkeletonBlock h="80px" />
          <SkeletonBlock h="40px" />
        </>
      ) : result ? (
        <>
          <div style={{ 
            background: 'var(--surface-low)', 
            borderRadius: 'var(--radius-lg)', 
            padding: '32px 24px', 
            textAlign: 'center',
            border: `1px solid ${cfg.color}33`,
            boxShadow: `0 0 30px ${cfg.color}11`
          }}>
            <div style={{ fontSize: '3.5rem', fontWeight: 800, color: cfg.color, fontFamily: 'var(--font-head)', lineHeight: 1 }}>
              {riskVal}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, color: '#7a8089', marginTop: '4px', letterSpacing: '0.05em' }}>/ 100</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: cfg.color, marginTop: '8px', letterSpacing: '0.1em' }}>
              {cfg.label}
            </div>
            {/* Gauge bar */}
            <div style={{ marginTop: '16px', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${riskVal}%`,
                background: `linear-gradient(90deg, ${cfg.color}66, ${cfg.color})`,
                boxShadow: `0 0 8px ${cfg.color}`,
                transition: 'width 1s ease',
                borderRadius: '2px'
              }} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '8px', opacity: 0.7 }}>
              <span>ANALYSIS CONFIDENCE</span>
              <span style={{ color: cfg.color, fontWeight: 700 }}>{confidence}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--surface-low)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ 
                height: '100%', 
                width: `${confidence}%`, 
                background: cfg.color,
                boxShadow: `0 0 10px ${cfg.color}`
              }} />
            </div>
          </div>

          <div style={{ 
            marginTop: 'auto',
            padding: '12px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.85rem',
            border: '1px solid var(--glass-border)'
          }}>
            <span style={{ opacity: 0.5 }}>CORE VECTOR: </span>
            <span style={{ fontWeight: 600 }}>{typeof result.location === 'string' ? result.location : 'GLOBAL SCAN'}</span>
          </div>
        </>
      ) : null}
    </div>
  )
}
