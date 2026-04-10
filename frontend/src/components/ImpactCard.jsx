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
      className="kinetic-card"
      style={{ display: 'flex', flexDirection: 'column' }}
    >
      {/* ── Header (always visible) ── */}
      <div style={{ marginBottom: '20px', flexShrink: 0 }}>
        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
          HUMANITARIAN & INFRASTRUCTURE IMPACT
        </span>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        overflowY: 'auto',
        flex: 1,
        maxHeight: '340px',
        paddingRight: '4px',
        /* Custom scrollbar */
        scrollbarWidth: 'thin',
        scrollbarColor: 'var(--primary) rgba(255,255,255,0.05)',
      }}>
        <style>{`
          .impact-scroll::-webkit-scrollbar { width: 4px; }
          .impact-scroll::-webkit-scrollbar-track { background: rgba(255,255,255,0.04); border-radius: 2px; }
          .impact-scroll::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 2px; }
        `}</style>

        <div className="impact-scroll" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          overflowY: 'auto',
          maxHeight: '340px',
          paddingRight: '4px',
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--primary) rgba(255,255,255,0.05)',
        }}>

          {/* ── Civilian Cost ── */}
          <div className="impact-section">
            <h4 style={{ fontSize: '0.8rem', color: 'white', marginBottom: '16px', opacity: 0.9 }}>CIVILIAN COST</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ opacity: 0.6, marginBottom: '4px' }}>CASUALTY RISK</div>
                <div style={{ fontWeight: 800, color: impact?.casualties?.toUpperCase() === 'HIGH' ? 'var(--risk-high)' : 'var(--primary)' }}>
                  {impact?.casualties || 'UNKNOWN'}
                </div>
              </div>
              <div style={{ fontSize: '0.85rem' }}>
                <div style={{ opacity: 0.6, marginBottom: '4px' }}>DISPLACEMENT</div>
                <div style={{ fontWeight: 700, color: 'var(--risk-medium)', lineHeight: 1.5, wordBreak: 'break-word' }}>
                  {impact?.displacement || 'STABLE'}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '8px' }}>IMPACTED RESOURCES</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {(impact?.shortages || []).map((s, i) => (
                  <span key={i} style={{ 
                    fontSize: '0.65rem', 
                    background: 'rgba(255,255,255,0.05)', 
                    border: '1px solid var(--glass-border)',
                    padding: '3px 10px',
                    borderRadius: '12px',
                    color: 'white',
                    whiteSpace: 'nowrap'
                  }}>
                    {typeof s === 'string' ? s.toUpperCase() : s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Operational Assets ── */}
          <div className="impact-section" style={{ borderLeft: '1px solid var(--glass-border)', paddingLeft: '24px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'white', marginBottom: '16px', opacity: 0.9 }}>OPERATIONAL ASSETS</h4>
            <div style={{ fontSize: '0.85rem', marginBottom: '20px' }}>
              <div style={{ opacity: 0.6, marginBottom: '4px' }}>BASE CONDITION</div>
              <div style={{ fontWeight: 700, lineHeight: 1.5, wordBreak: 'break-word' }}>
                {typeof infra?.status === 'string' ? infra.status.toUpperCase() : 'FUNCTIONAL'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.7rem', opacity: 0.5, marginBottom: '8px' }}>CRITICAL CHOKEPOINTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(infra?.chokepoints || []).map((c, i) => (
                  <div key={i} style={{ 
                    fontSize: '0.8rem', 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '8px',
                    color: 'white',
                    lineHeight: 1.4
                  }}>
                    <span style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>•</span>
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
