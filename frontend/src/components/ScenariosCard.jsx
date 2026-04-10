import React from 'react';

const SCENARIOS = [
  {
    key:    'best',
    label:  'BEST CASE',
    icon:   '✅',
    color:  'var(--risk-low)',
    desc:   'DE-ESCALATION',
  },
  {
    key:    'likely',
    label:  'MOST LIKELY',
    icon:   '📊',
    color:  'var(--primary)',
    desc:   'CURRENT TRACK',
  },
  {
    key:    'worst',
    label:  'WORST CASE',
    icon:   '⚠️',
    color:  'var(--risk-high)',
    desc:   'ESCALATION',
  },
]

export default function ScenariosCard({ result, loading }) {
  const scenarios = result?.scenarios || {}

  return (
    <div className="kinetic-card">
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
          FUTURE SCENARIO ANALYSIS
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '200px', borderRadius: 'var(--radius-xl)' }} />)
        ) : result ? (
          SCENARIOS.map((cfg) => (
            <div
              key={cfg.key}
              style={{
                background: 'var(--surface-low)',
                border: `1px solid var(--glass-border)`,
                borderRadius: 'var(--radius-xl)',
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                transition: 'var(--transition-smooth)',
                position: 'relative',
                overflow: 'hidden'
              }}
              className="scenario-item"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.5rem' }}>{cfg.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: cfg.color, fontSize: '0.9rem' }}>{cfg.label}</div>
                  <div style={{ fontSize: '0.65rem', color: '#7a8089', fontWeight: 700 }}>{cfg.desc}</div>
                </div>
              </div>
              
              <div style={{ height: '1px', background: 'var(--glass-border)' }} />
              
              <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, flex: 1 }}>
                {scenarios[cfg.key]?.description || scenarios[cfg.key] || 'No scenario generated.'}
              </div>

              {scenarios[cfg.key]?.probability && (
                 <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.65rem', color: cfg.color, fontWeight: 800 }}>PROBABILITY:</span>
                    <span style={{ 
                      fontSize: '0.75rem',
                      background: `${cfg.color}11`, 
                      color: cfg.color, 
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: `1px solid ${cfg.color}33`,
                      fontWeight: 800
                    }}>
                      {scenarios[cfg.key].probability}
                    </span>
                 </div>
              )}
            </div>
          ))
        ) : null}
      </div>
    </div>
  )
}
