function SkeletonBlock({ h = '20px', w = '100%', mb = '0' }) {
  return (
    <div className="skeleton" style={{ height: h, width: w, marginBottom: mb, borderRadius: '6px' }} />
  )
}

const SIGNAL_COLORS = [
  ['rgba(255,64,64,0.12)',   '#ff6060'],
  ['rgba(255,140,0,0.12)',   '#ffaa44'],
  ['rgba(0,212,255,0.10)',   '#00d4ff'],
  ['rgba(123,94,167,0.15)',  '#b09fd8'],
  ['rgba(0,230,118,0.10)',   '#00e676'],
  ['rgba(255,64,64,0.10)',   '#ff8080'],
  ['rgba(0,212,255,0.08)',   '#66ccff'],
]

export default function SignalsCard({ result, loading }) {
  const signals = result?.signals || []

  const S = {
    card: { padding: '24px 28px' },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '18px',
    },
    title: {
      fontSize: '0.68rem',
      fontWeight: 700,
      color: '#3d5080',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    count: {
      fontSize: '0.75rem',
      color: '#00d4ff',
      fontWeight: 600,
      background: 'rgba(0,212,255,0.1)',
      padding: '3px 10px',
      borderRadius: '20px',
    },
    tagsWrap: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
    },
    tag: (i) => ({
      background: SIGNAL_COLORS[i % SIGNAL_COLORS.length][0],
      border: `1px solid ${SIGNAL_COLORS[i % SIGNAL_COLORS.length][1]}44`,
      borderRadius: '8px',
      padding: '8px 14px',
      fontSize: '0.83rem',
      color: SIGNAL_COLORS[i % SIGNAL_COLORS.length][1],
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'transform 0.15s',
      cursor: 'default',
    }),
    empty: {
      fontSize: '0.85rem',
      color: '#3d5080',
      fontStyle: 'italic',
    },
  }

  return (
    <div className="glass-card" style={S.card}>
      <div style={S.header}>
        <span style={S.title}>Detected Conflict Signals</span>
        {!loading && result && (
          <span style={S.count}>{signals.length} signals</span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[120, 90, 140, 100, 110].map((w, i) => (
            <SkeletonBlock key={i} h="36px" w={`${w}px`} />
          ))}
        </div>
      ) : signals.length > 0 ? (
        <div style={S.tagsWrap}>
          {signals.map((signal, i) => (
            <span
              key={i}
              style={S.tag(i)}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              ⚡ {signal}
            </span>
          ))}
        </div>
      ) : (
        <p style={S.empty}>No signals detected in current analysis.</p>
      )}
    </div>
  )
}
