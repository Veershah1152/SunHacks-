import { motion } from 'framer-motion'

export default function StrategicBriefCard({ result, loading }) {
  if (loading || !result) return null;
  const reasoning = result?.reasoning || "Consensus derived from multi-agent signal analysis.";

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card brief-card"
      style={{
        background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))',
        border: '1px solid rgba(0,212,255,0.15)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        padding: '24px',
        borderRadius: '16px',
        marginBottom: '20px'
      }}
    >
      <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
        <div style={{ fontSize: '32px', filter: 'drop-shadow(0 0 10px rgba(0,212,255,0.5))' }}>📜</div>
        <div style={{ flex: 1 }}>
          <h4 style={{ margin: 0, color: 'var(--accent-blue)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em', marginBottom: '8px' }}>
             Strategic Reasoning & Consensus
          </h4>
          <p style={{ 
            fontSize: '1.1rem', 
            fontWeight: 500, 
            lineHeight: 1.6, 
            color: '#e2e8f0',
            margin: 0
           }}>
             {reasoning}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
