import React from 'react';
import { motion } from 'framer-motion';

export default function StrategicBriefCard({ result, loading }) {
  if (loading || !result) return null;
  const reasoning = result?.reasoning || "Consensus derived from multi-agent signal analysis.";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="kinetic-card"
      style={{ borderLeft: '4px solid var(--primary)' }}
    >
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.9 }}>📜</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ 
            fontFamily: 'var(--font-head)',
            color: 'var(--primary)', 
            textTransform: 'uppercase', 
            fontSize: '0.8rem', 
            letterSpacing: '0.1em', 
            marginBottom: '10px' 
          }}>
             STRATEGIC BRIEF & CONSENSUS
          </h4>
          <p style={{ 
            fontSize: '1.25rem', 
            fontWeight: 400, 
            lineHeight: 1.6, 
            color: 'white',
            fontFamily: 'var(--font-body)',
            margin: 0
           }}>
             {reasoning}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
