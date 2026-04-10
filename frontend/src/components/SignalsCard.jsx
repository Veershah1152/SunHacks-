import React from 'react';

export default function SignalsCard({ result, loading }) {
  const signals = result?.signals || [];

  return (
    <div className="intel-card">
      <div className="card-label">Multi-Agent Signal Decoding</div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
        {loading ? (
          [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: 'var(--radius-lg)', marginBottom: '8px' }} />)
        ) : signals.length > 0 ? (
          signals.map((sig, i) => (
            <div key={i} className="feed-item">
              <div className={`feed-accent ${sig.intensity > 0.7 ? 'active' : ''}`} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {sig.source || 'INTEL_STREAM'}
                </div>
                <div className="feed-text" style={{ fontSize: '0.85rem' }}>
                  {sig.text}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>INTENSITY</div>
                <div style={{ fontWeight: 800, color: sig.intensity > 0.7 ? 'var(--risk-high-on)' : 'var(--primary)', fontFamily: 'var(--font-display)' }}>
                  {Math.round(sig.intensity * 100)}%
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            No active signals detected in current vector.
          </div>
        )}
      </div>
    </div>
  );
}
