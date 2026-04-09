const RISK_CONFIG = {
  HIGH:   { color: '#ff4040', dim: 'rgba(255,64,64,0.12)',   icon: '🔴', label: 'HIGH RISK'   },
  MEDIUM: { color: '#ff8c00', dim: 'rgba(255,140,0,0.12)',   icon: '🟠', label: 'MEDIUM RISK' },
  LOW:    { color: '#00e676', dim: 'rgba(0,230,118,0.12)',   icon: '🟢', label: 'LOW RISK'    },
}

function SkeletonBlock({ h = '20px', w = '100%', mb = '0' }) {
  return (
    <div className="skeleton" style={{ height: h, width: w, marginBottom: mb, borderRadius: '6px' }} />
  )
}

export default function RiskCard({ result, loading }) {
  const cfg = result ? (RISK_CONFIG[result.risk] || RISK_CONFIG.MEDIUM) : null
  const confidence = result ? Math.round((result.confidence ?? 0.5) * 100) : 0

  const S = {
    card: {
      padding: '28px 24px',
      textAlign: 'center',
      height: '100%',
      borderColor: cfg ? `${cfg.color}33` : undefined,
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
    },
    sectionLabel: {
      fontSize: '0.68rem',
      fontWeight: 700,
      color: '#3d5080',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      textAlign: 'left',
    },
    riskBadge: {
      display: 'inline-flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '10px',
    },
    riskIcon: {
      fontSize: '52px',
      lineHeight: 1,
      filter: `drop-shadow(0 0 20px ${cfg?.color || '#888'})`,
    },
    riskText: {
      fontFamily: "'Space Grotesk', sans-serif",
      fontSize: '2rem',
      fontWeight: 800,
      color: cfg?.color || '#7a90b8',
      letterSpacing: '-0.02em',
      textShadow: `0 0 30px ${cfg?.color || '#888'}66`,
    },
    riskBg: {
      background: cfg?.dim || 'rgba(255,255,255,0.05)',
      borderRadius: '16px',
      padding: '20px',
      width: '100%',
    },
    divider: {
      height: '1px',
      background: 'rgba(0,212,255,0.08)',
    },
    confidenceLabel: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.8rem',
      color: '#7a90b8',
      marginBottom: '8px',
    },
    confidenceTrack: {
      height: '8px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: '4px',
      overflow: 'hidden',
    },
    confidenceFill: {
      height: '100%',
      width: `${confidence}%`,
      background: cfg
        ? `linear-gradient(90deg, ${cfg.color}88, ${cfg.color})`
        : 'rgba(0,212,255,0.4)',
      borderRadius: '4px',
      transition: 'width 1s cubic-bezier(0.4,0,0.2,1)',
    },
    locationRow: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '8px',
      padding: '10px 14px',
    },
    locationText: {
      fontSize: '0.88rem',
      color: '#e0eaff',
      fontWeight: 500,
      textTransform: 'capitalize',
    },
  }

  const riskVal = result?.risk_numerical ?? 50
  const trajectory = result?.trajectory || 'STABLE'

  const getTrajectoryColor = (t) => {
    if (t.includes('ESCALATING')) return '#ff4040'
    if (t.includes('STABLE')) return '#00d4ff'
    return '#00e676' // De-escalating
  }

  return (
    <div className="glass-card" style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={S.sectionLabel}>Tactical Assessment</span>
        {!loading && result && (
          <span className="badge" style={{ 
            background: `${getTrajectoryColor(trajectory)}22`, 
            color: getTrajectoryColor(trajectory),
            fontSize: '0.7rem',
            padding: '4px 8px',
            border: `1px solid ${getTrajectoryColor(trajectory)}44`
          }}>
            {trajectory}
          </span>
        )}
      </div>

      {loading ? (
        <>
          <SkeletonBlock h="120px" />
          <SkeletonBlock h="40px" />
          <SkeletonBlock h="50px" />
        </>
      ) : result ? (
        <>
          <div style={S.riskBg}>
            <div style={S.riskBadge}>
               <div style={{ fontSize: '3rem', fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{riskVal}%</div>
               <span style={{ fontSize: '0.8rem', opacity: 0.8, color: cfg.color }}>{cfg.label}</span>
            </div>
          </div>

          <div>
            <div style={S.confidenceLabel}>
              <span>Analysis Confidence</span>
              <strong style={{ color: cfg.color }}>{confidence}%</strong>
            </div>
            <div style={S.confidenceTrack}>
              <div style={S.confidenceFill} />
            </div>
          </div>

          {result.location && result.location !== 'unknown' && (
            <>
              <div style={S.divider} />
              <div style={S.locationRow}>
                <span>📍 Primary Vector:</span>
                <span style={S.locationText}>{result.location}</span>
              </div>
            </>
          )}
        </>
      ) : null}
    </div>
  )
}
