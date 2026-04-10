import React from 'react';

export default function SignalsCard({ result, loading }) {
  const signals = result?.signals || [];

  return (
    <div className="kinetic-card">
      <div style={{ marginBottom: '24px' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
          MULTI-AGENT SIGNAL DECODING
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius-lg)' }} />)
        ) : signals.length > 0 ? (
          signals.map((sig, i) => (
            <div 
              key={i} 
              style={{ 
                padding: '16px', 
                background: 'var(--surface-low)', 
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-lg)',
                display: 'flex',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ 
                width: '40px', 
                height: '40px', 
                background: i % 2 === 0 ? 'var(--primary-container)' : 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem'
              }}>
                {sig.type === 'social' ? '🐦' : sig.type === 'news' ? '📰' : '📡'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {sig.source || 'INTEL_STREAM'}
                </div>
                <div style={{ fontSize: '0.95rem', color: 'white', lineHeight: 1.4 }}>
                  {sig.text}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.7rem', color: '#7a8089' }}>INTENSITY</div>
                <div style={{ fontWeight: 800, color: sig.intensity > 0.7 ? 'var(--risk-high)' : 'var(--primary)' }}>
                  {Math.round(sig.intensity * 100)}%
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7a8089', fontSize: '0.9rem' }}>
            No active signals detected in current vector.
          </div>
        )}
      </div>
    </div>
  );
}
