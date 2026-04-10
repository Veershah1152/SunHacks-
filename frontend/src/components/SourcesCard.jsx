import React from 'react';

export default function SourcesCard({ result, loading }) {
  const sources = result?.sources || [];

  return (
    <div className="intel-card">
      <div className="card-label">Source Traceability &amp; Audit</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-lg)' }} />)
        ) : sources.length > 0 ? (
          sources.map((src, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '16px', 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--outline-ghost)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'; e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>{src.name?.toUpperCase() || 'DOCUMENT'}</span>
                <span className="source-pill">
                  {src.type || 'OSINT'}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.4 }}>
                "{src.title || 'Classified Signal Source'}"
              </div>
              {src.url && (
                <a 
                  href={src.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    fontSize: '0.65rem', 
                    color: 'var(--primary)', 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    marginTop: '4px',
                    opacity: 0.8,
                    fontWeight: 700
                  }}
                >
                  LINK TO VERACITY ↗
                </a>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px', color: 'rgba(255,255,255,0.4)' }}>
            No source citations available for this intelligence packet.
          </div>
        )}
      </div>
    </div>
  );
}
