import React from 'react';
import { motion } from 'framer-motion';

export default function ImpactCard({ result, loading }) {
  if (loading || !result) return null;
  const impact = result?.civilian_impact;
  const infra = result?.infrastructure;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="intel-card"
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* ── Header (always visible) ── */}
      <div className="card-label" style={{ marginBottom: '20px', flexShrink: 0 }}>
        Humanitarian &amp; Infrastructure
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        overflowY: 'auto',
        flex: 1,
        maxHeight: '340px',
        paddingRight: '8px',
        /* Custom scrollbar */
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--primary) transparent',
      }}>
        <style>{`
          .impact-scroll::-webkit-scrollbar { width: 4px; }
          .impact-scroll::-webkit-scrollbar-track { background: transparent; }
          .impact-scroll::-webkit-scrollbar-thumb { background: var(--primary-container); border-radius: 2px; }
          .impact-scroll:hover::-webkit-scrollbar-thumb { background: var(--primary); }
        `}</style>

        <div className="impact-scroll" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
        }}>

          {/* ── Civilian Cost ── */}
          <div className="impact-section">
            <h4 style={{ fontSize: '0.8rem', color: 'white', marginBottom: '16px', opacity: 0.9, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>CIVILIAN COST</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ opacity: 0.6, marginBottom: '6px', fontSize: '0.65rem', fontWeight: 800 }}>CASUALTY RISK</div>
                <div style={{ fontWeight: 800, color: impact?.casualties?.toUpperCase() === 'HIGH' ? 'var(--risk-high)' : 'var(--primary)' }}>
                  {impact?.casualties || 'UNKNOWN'}
                </div>
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ opacity: 0.6, marginBottom: '6px', fontSize: '0.65rem', fontWeight: 800 }}>DISPLACEMENT</div>
                <div style={{ fontWeight: 600, color: 'var(--risk-medium)', lineHeight: 1.5, wordBreak: 'break-word', fontSize: '0.8rem' }}>
                  {impact?.displacement || 'STABLE'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '24px' }}>
              <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '10px', fontWeight: 800 }}>IMPACTED RESOURCES</div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {(impact?.shortages || []).map((s, i) => (
                  <span key={i} className="source-pill" style={{ margin: 0 }}>
                    {typeof s === 'string' ? s.toUpperCase() : s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Operational Assets ── */}
          <div className="impact-section" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', paddingLeft: '24px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'white', marginBottom: '16px', opacity: 0.9, fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>OPERATIONAL ASSETS</h4>
            <div style={{ fontSize: '0.85rem', marginBottom: '24px' }}>
              <div style={{ opacity: 0.6, marginBottom: '6px', fontSize: '0.65rem', fontWeight: 800 }}>BASE CONDITION</div>
              <div style={{ fontWeight: 600, lineHeight: 1.5, wordBreak: 'break-word', fontSize: '0.8rem' }}>
                {typeof infra?.status === 'string' ? infra.status.toUpperCase() : 'FUNCTIONAL'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.65rem', opacity: 0.5, marginBottom: '10px', fontWeight: 800 }}>CRITICAL CHOKEPOINTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(infra?.chokepoints || []).map((c, i) => (
                  <div key={i} style={{ 
                    fontSize: '0.8rem', 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px',
                    color: 'rgba(255,255,255,0.85)',
                    lineHeight: 1.5
                  }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px', fontSize: '10px' }}>▶</span>
                    <span>{typeof c === 'string' ? c : JSON.stringify(c)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
