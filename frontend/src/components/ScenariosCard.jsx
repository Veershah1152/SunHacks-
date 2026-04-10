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
    <div className="intel-card">
      <div className="card-label">Future Scenario Analysis</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '16px' }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '70px', borderRadius: 'var(--radius-md)' }} />)
        ) : result ? (
          SCENARIOS.map((cfg) => (
            <div key={cfg.key} className="scenario-chip">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                <div className="scenario-code" style={{ color: cfg.color }}>{cfg.label} // {cfg.desc}</div>
                {scenarios[cfg.key]?.probability && (
                  <div style={{ 
                    fontSize: '0.65rem',
                    color: cfg.color, 
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '0.05em'
                  }}>
                    {scenarios[cfg.key].probability.toUpperCase()}
                  </div>
                )}
              </div>
              <div className="scenario-text">
                {scenarios[cfg.key]?.description || scenarios[cfg.key] || 'No scenario generated.'}
              </div>
            </div>
          ))
        ) : null}
      </div>
    </div>
  )
}
