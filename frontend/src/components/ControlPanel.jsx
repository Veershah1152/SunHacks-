const S = {
  panel: {
    padding: '24px 28px',
    marginBottom: '8px',
  },
  label: {
    fontSize: '0.72rem',
    fontWeight: 600,
    color: '#7a90b8',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '10px',
    display: 'block',
  },
  inputRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'stretch',
  },
  inputWrap: {
    flex: 1,
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: '16px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(0,212,255,0.15)',
    borderRadius: '10px',
    padding: '14px 16px 14px 48px',
    fontSize: '1rem',
    color: '#e0eaff',
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    transition: 'border-color 0.2s, background 0.2s',
  },
  btnGroup: {
    display: 'flex',
    gap: '10px',
  },
  btnAnalyze: (loading) => ({
    background: loading
      ? 'rgba(0,212,255,0.15)'
      : 'linear-gradient(135deg, #00d4ff, #0099cc)',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 28px',
    fontSize: '0.9rem',
    fontWeight: 700,
    color: loading ? '#7a90b8' : '#050912',
    cursor: loading ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap',
  }),
  btnUpdate: (updating) => ({
    background: 'rgba(123,94,167,0.15)',
    border: '1px solid rgba(123,94,167,0.3)',
    borderRadius: '10px',
    padding: '14px 22px',
    fontSize: '0.9rem',
    fontWeight: 600,
    color: updating ? '#7a90b8' : '#b09fd8',
    cursor: updating ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.2s',
    fontFamily: 'Inter, sans-serif',
    whiteSpace: 'nowrap',
  }),
  hint: {
    marginTop: '12px',
    fontSize: '0.76rem',
    color: '#3d5080',
    lineHeight: 1.5,
  },
  spinner: {
    width: '14px',
    height: '14px',
    border: '2px solid rgba(0,212,255,0.3)',
    borderTop: '2px solid #00d4ff',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
  },
}

const EXAMPLE_QUERIES = ['Sudan conflict', 'Gaza ceasefire', 'Ukraine war', 'Myanmar crisis', 'Sahel region']

export default function ControlPanel({
  query, onQueryChange, onAnalyze, onUpdate, loading, updating,
}) {
  const handleKey = (e) => { if (e.key === 'Enter' && !loading) onAnalyze() }

  return (
    <div className="glass-card" style={S.panel}>
      <label style={S.label} htmlFor="conflict-query">
        Enter Region or Conflict Topic
      </label>

      <div style={S.inputRow}>
        <div style={S.inputWrap}>
          <span style={S.icon}>🌐</span>
          <input
            id="conflict-query"
            type="text"
            placeholder="e.g. Sudan conflict, Gaza, Ukraine war..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            style={S.input}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(0,212,255,0.45)'
              e.target.style.background  = 'rgba(255,255,255,0.06)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(0,212,255,0.15)'
              e.target.style.background  = 'rgba(255,255,255,0.04)'
            }}
          />
        </div>

        <div style={S.btnGroup}>
          <button
            id="btn-update"
            onClick={onUpdate}
            disabled={updating || loading}
            style={S.btnUpdate(updating)}
            title="Ingest fresh OSINT data from news APIs and RSS feeds"
          >
            {updating ? <span style={S.spinner} /> : '📡'}
            {updating ? 'Updating...' : 'Update Data'}
          </button>

          <button
            id="btn-analyze"
            onClick={onAnalyze}
            disabled={loading || updating}
            style={S.btnAnalyze(loading)}
            title="Run 4-agent AI analysis pipeline"
          >
            {loading ? <span style={S.spinner} /> : '⚡'}
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </div>
      </div>

      <p style={S.hint}>
        Try: {EXAMPLE_QUERIES.map((q, i) => (
          <span key={q}>
            <button
              onClick={() => onQueryChange(q)}
              style={{ background: 'none', border: 'none', color: '#00d4ff', cursor: 'pointer', fontSize: '0.76rem', padding: 0 }}
            >
              {q}
            </button>
            {i < EXAMPLE_QUERIES.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </p>
    </div>
  )
}
