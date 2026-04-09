function SkeletonBlock({ h = '20px', w = '100%' }) {
  return <div className="skeleton" style={{ height: h, width: w, borderRadius: '6px' }} />
}

function truncateUrl(url, maxLen = 60) {
  if (!url) return 'unknown source'
  try {
    const u = new URL(url)
    const display = `${u.hostname}${u.pathname}`
    return display.length > maxLen ? display.slice(0, maxLen) + '…' : display
  } catch {
    return url.length > maxLen ? url.slice(0, maxLen) + '…' : url
  }
}

function getDomain(url) {
  try { return new URL(url).hostname.replace('www.', '') }
  catch { return 'source' }
}

export default function SourcesCard({ result, loading }) {
  const sources = (result?.sources || []).filter(Boolean)

  const S = {
    card: { padding: '24px 28px' },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
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
      color: '#7b5ea7',
      fontWeight: 600,
      background: 'rgba(123,94,167,0.12)',
      padding: '3px 10px',
      borderRadius: '20px',
    },
    list: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    item: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '8px',
      padding: '10px 14px',
      textDecoration: 'none',
      transition: 'all 0.2s',
      color: '#c0cfe8',
    },
    domainBadge: {
      fontSize: '0.68rem',
      fontWeight: 600,
      background: 'rgba(0,212,255,0.08)',
      border: '1px solid rgba(0,212,255,0.15)',
      borderRadius: '5px',
      padding: '2px 8px',
      color: '#00d4ff',
      whiteSpace: 'nowrap',
      flexShrink: 0,
    },
    urlText: {
      fontSize: '0.8rem',
      flex: 1,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    extIcon: {
      fontSize: '12px',
      color: '#3d5080',
      flexShrink: 0,
    },
    emptyMsg: {
      fontSize: '0.85rem',
      color: '#3d5080',
      fontStyle: 'italic',
    },
  }

  return (
    <div className="glass-card" style={S.card}>
      <div style={S.header}>
        <span style={S.title}>Intelligence Sources</span>
        {!loading && sources.length > 0 && (
          <span style={S.count}>{sources.length} sources</span>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1, 2, 3].map((i) => (
            <SkeletonBlock key={i} h="42px" />
          ))}
        </div>
      ) : sources.length > 0 ? (
        <div style={S.list}>
          {sources.map((url, i) => (
            <a
              key={i}
              href={url.startsWith('http') ? url : `https://${url}`}
              target="_blank"
              rel="noopener noreferrer"
              style={S.item}
              onMouseEnter={(e) => {
                e.currentTarget.style.background  = 'rgba(0,212,255,0.06)'
                e.currentTarget.style.borderColor = 'rgba(0,212,255,0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background  = 'rgba(255,255,255,0.03)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
              }}
            >
              <span style={S.domainBadge}>{getDomain(url)}</span>
              <span style={S.urlText}>{truncateUrl(url)}</span>
              <span style={S.extIcon}>↗</span>
            </a>
          ))}
        </div>
      ) : (
        <p style={S.emptyMsg}>No sources available in current analysis.</p>
      )}
    </div>
  )
}
