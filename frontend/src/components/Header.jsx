/* Header component with inline styles for self-containment */

/* Inline styles to avoid needing a separate CSS module */
const S = {
  header: {
    position: 'relative',
    padding: '40px 0 32px',
    overflow: 'hidden',
  },
  gradientBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: 'linear-gradient(90deg, transparent, #00d4ff, #7b5ea7, #00d4ff, transparent)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 3s linear infinite',
  },
  scanLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40px',
    background: 'linear-gradient(180deg, rgba(0,212,255,0.04) 0%, transparent 100%)',
    animation: 'scanline 4s linear infinite',
    pointerEvents: 'none',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '8px',
  },
  badge: {
    background: 'rgba(0,212,255,0.1)',
    border: '1px solid rgba(0,212,255,0.25)',
    borderRadius: '6px',
    padding: '4px 10px',
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#00d4ff',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  statusDot: (isActive) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    color: isActive ? '#00e676' : '#7a90b8',
  }),
  dot: (isActive) => ({
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: isActive ? '#00e676' : '#3d5080',
    animation: isActive ? 'pulse 1.5s infinite' : 'none',
    flexShrink: 0,
  }),
  title: {
    fontFamily: "'Space Grotesk', sans-serif",
    fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
    fontWeight: 800,
    background: 'linear-gradient(135deg, #e0eaff 0%, #00d4ff 50%, #7b5ea7 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    letterSpacing: '-0.02em',
    lineHeight: 1.1,
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '0.9rem',
    color: '#7a90b8',
    lineHeight: 1.6,
    maxWidth: '540px',
  },
  chips: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '16px',
  },
  chip: {
    background: 'rgba(123,94,167,0.12)',
    border: '1px solid rgba(123,94,167,0.2)',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '0.72rem',
    color: '#b09fd8',
    fontWeight: 500,
  },
}

const STATUS_LABELS = {
  idle:      { text: 'System Ready',   active: true  },
  analyzing: { text: 'Analyzing...',   active: true  },
  done:      { text: 'Report Ready',   active: true  },
  updated:   { text: 'Data Updated',   active: true  },
}

export default function Header({ status = 'idle' }) {
  const { text, active } = STATUS_LABELS[status] || STATUS_LABELS.idle

  return (
    <header style={S.header}>
      <div style={S.gradientBar} />
      <div style={S.scanLine} />

      <div style={S.topRow}>
        <span style={S.badge}>OSINT · AI · CREWAI</span>
        <span style={S.statusDot(active)}>
          <span style={S.dot(active)} />
          {text}
        </span>
      </div>

      <h1 style={S.title}>
        Conflict Intelligence<br />System
      </h1>

      <p style={S.subtitle}>
        AI-powered early-warning system that ingests live OSINT data,
        detects escalation signals, and generates explainable intelligence reports
        using a 4-agent LangChain × CrewAI pipeline.
      </p>

      <div style={S.chips}>
        {['Ollama / Mistral', 'FAISS + SQLite', 'BBC · Reuters · AJ RSS', 'GNews API'].map(c => (
          <span key={c} style={S.chip}>{c}</span>
        ))}
      </div>
    </header>
  )
}
