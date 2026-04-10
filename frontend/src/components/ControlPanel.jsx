import React from 'react';

const EXAMPLE_QUERIES = ['Sudan conflict', 'Gaza ceasefire', 'Ukraine war', 'Myanmar crisis', 'Sahel region'];

export default function ControlPanel({
  query, onQueryChange, onAnalyze, onUpdate, loading, updating,
}) {
  const handleKey = (e) => { if (e.key === 'Enter' && !loading) onAnalyze() };

  return (
    <div className="kinetic-card">
      <label 
        style={{ 
          display: 'block', 
          fontSize: '0.75rem', 
          fontFamily: 'var(--font-head)', 
          fontWeight: 700, 
          color: 'var(--primary)', 
          marginBottom: '12px',
          letterSpacing: '0.05em'
        }} 
        htmlFor="conflict-query"
      >
        TARGET REGION / TOPIC SCAN
      </label>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'stretch' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🌐</span>
          <input
            id="conflict-query"
            type="text"
            placeholder="e.g. Sudan conflict, Gaza, Ukraine war..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--surface-low)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px 16px 14px 48px',
              fontSize: '1rem',
              color: 'white',
              outline: 'none',
              fontFamily: 'var(--font-body)',
              transition: 'var(--transition-smooth)'
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--glass-border)'}
          />
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            className="tactical-btn"
            onClick={onUpdate}
            disabled={updating || loading}
            title="Ingest fresh OSINT data"
          >
            {updating ? '...' : '📡'}
            {updating ? 'INGESTING...' : 'UPDATE DATA'}
          </button>

          <button
            className="tactical-btn"
            style={{ background: 'var(--primary)', color: 'var(--on-primary)' }}
            onClick={onAnalyze}
            disabled={loading || updating}
            title="Run analysis pipeline"
          >
            {loading ? '...' : '⚡'}
            {loading ? 'ANALYZING...' : 'ANALYZE'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: '16px', fontSize: '0.75rem', color: '#7a8089' }}>
        RECENTS: {EXAMPLE_QUERIES.map((q, i) => (
          <span key={q}>
            <button
              onClick={() => onQueryChange(q)}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px', opacity: 0.8 }}
            >
              {q}
            </button>
            {i < EXAMPLE_QUERIES.length - 1 ? '·' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
