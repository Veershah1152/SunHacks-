import React from 'react';

export default function SourcesCard({ result, loading }) {
  const sources = result?.sources || [];

  return (
    <div className="kinetic-card">
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
          SOURCE TRACEABILITY & AUDIT
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {loading ? (
          [1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: '80px', borderRadius: 'var(--radius-lg)' }} />)
        ) : sources.length > 0 ? (
          sources.map((src, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '16px', 
                background: 'var(--surface-low)', 
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'var(--transition-smooth)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)' }}>{src.name?.toUpperCase() || 'DOCUMENT'}</span>
                <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                  {src.type || 'OSINT'}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
                "{src.title || 'Classified Signal Source'}"
              </div>
              {src.url && (
                <a 
                  href={src.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  style={{ 
                    fontSize: '0.7rem', 
                    color: 'var(--primary)', 
                    textDecoration: 'none', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    marginTop: '4px',
                    opacity: 0.8
                  }}
                >
                  LINK TO VERACITY ↗
                </a>
              )}
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '40px', color: '#7a8089' }}>
            No source citations available for this intelligence packet.
          </div>
        )}
      </div>
    </div>
  );
}
