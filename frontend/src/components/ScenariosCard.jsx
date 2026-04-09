function SkeletonBlock({ h = '20px', w = '100%' }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: '8px' }} />
}

const SCENARIOS = [
  {
    key:    'best',
    label:  'Best Case',
    icon:   '✅',
    color:  '#00e676',
    dim:    'rgba(0,230,118,0.08)',
    border: 'rgba(0,230,118,0.2)',
    desc:   'De-escalation scenario',
  },
  {
    key:    'likely',
    label:  'Most Likely',
    icon:   '📊',
    color:  '#00d4ff',
    dim:    'rgba(0,212,255,0.08)',
    border: 'rgba(0,212,255,0.2)',
    desc:   'Current trajectory',
  },
  {
    key:    'worst',
    label:  'Worst Case',
    icon:   '⚠️',
    color:  '#ff4040',
    dim:    'rgba(255,64,64,0.08)',
    border: 'rgba(255,64,64,0.2)',
    desc:   'Escalation scenario',
  },
]

export default function ScenariosCard({ result, loading }) {
  const scenarios = result?.scenarios || {}

  const S = {
    card: { padding: '28px' },
    title: {
      fontSize: '0.68rem',
      fontWeight: 700,
      color: '#3d5080',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      marginBottom: '20px',
      display: 'block',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '16px',
    },
    scenarioCard: (cfg) => ({
      background: cfg.dim,
      border: `1px solid ${cfg.border}`,
      borderRadius: '14px',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all 0.2s',
    }),
    cardHeader: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    cardIcon: {
      fontSize: '20px',
    },
    cardLabel: (cfg) => ({
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: '0.9rem',
      fontWeight: 700,
      color: cfg.color,
    }),
    cardDesc: {
      fontSize: '0.7rem',
      color: '#3d5080',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    divider: (cfg) => ({
      height: '1px',
      background: cfg.border,
    }),
    cardText: {
      fontSize: '0.85rem',
      color: '#c0cfe8',
      lineHeight: 1.65,
    },
  }

  return (
    <div className="glass-card" style={S.card}>
      <span style={S.title}>Future Scenario Analysis</span>

      {loading ? (
        <div style={S.grid}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <SkeletonBlock h="28px" w="60%" />
              <SkeletonBlock h="80px" />
              <SkeletonBlock h="60px" />
            </div>
          ))}
        </div>
      ) : result ? (
        <div style={S.grid}>
          {SCENARIOS.map((cfg) => (
            <div
              key={cfg.key}
              style={S.scenarioCard(cfg)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = `0 8px 32px ${cfg.color}22`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={S.cardHeader}>
                <span style={S.cardIcon}>{cfg.icon}</span>
                <div>
                  <div style={S.cardLabel(cfg)}>{cfg.label}</div>
                  <div style={S.cardDesc}>{cfg.desc}</div>
                </div>
              </div>
              <div style={S.divider(cfg)} />
              <div style={S.cardText}>
                {scenarios[cfg.key]?.description || scenarios[cfg.key] || 'No scenario generated.'}
                {scenarios[cfg.key]?.probability && (
                   <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '0.7rem', color: cfg.color, fontWeight: 700 }}>PROBABILITY:</span>
                      <span className="badge" style={{ backgroundColor: `${cfg.color}11`, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
                        {scenarios[cfg.key].probability}
                      </span>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <style>{`
        @media (max-width: 700px) {
          .scenarios-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
