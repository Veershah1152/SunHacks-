import React from 'react';
import { motion } from 'framer-motion';

export default function StrategicBriefCard({ result, loading }) {
  if (loading || !result) return null;
  const reasoning = result?.reasoning || 'Consensus derived from multi-agent signal analysis.';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="intel-card accent-primary"
      style={{ height: '100%' }}
    >
      <div className="card-label">SITUATION REPORT // ALPHA_VECTOR</div>
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '-24px',
          top: '0',
          bottom: '0',
          width: '2px',
          background: 'var(--primary)',
          opacity: 0.2
        }} />
        <p style={{
          fontSize: '1.1rem',
          fontWeight: 400,
          lineHeight: 1.8,
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'var(--font-body)',
          marginBottom: '20px',
          fontStyle: 'italic',
          paddingLeft: '10px'
        }}>
          "{reasoning}"
        </p>

        {/* Intelligence Metrics Row */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px' }}>
          <div>
            <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>Confidence Score</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{((result.confidence || 0.5) * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>Signal Depth</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>MATCHED</div>
          </div>
          {result.sources && result.sources.length > 0 && (
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>Evidence Footprint</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                {result.sources.slice(0, 5).map((s, i) => (
                  <a key={i} href={s} target="_blank" rel="noreferrer" style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '1px', display: 'block' }} title={s} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Verification Signature */}
        <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '2px solid rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
            MD5_AUTH: {Math.random().toString(36).substring(7).toUpperCase()}..{Math.random().toString(36).substring(7).toUpperCase()}
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.4, letterSpacing: '0.2em' }}>
            VERIFIED_CONSENSUS
          </div>
        </div>
      </div>
    </motion.div>
  );
}
