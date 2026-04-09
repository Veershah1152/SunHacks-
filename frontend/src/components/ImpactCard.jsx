import { motion } from 'framer-motion'

export default function ImpactCard({ result, loading }) {
  if (loading) return null;
  const impact = result?.civilian_impact;
  const infra = result?.infrastructure;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card impact-card"
    >
      <div className="card-header">
        <h3>🚨 Humanitarian & Infrastructure Impact</h3>
      </div>
      
      <div className="impact-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '15px' }}>
        <div className="impact-section">
          <h4>Humanitarian Cost</h4>
          <div className="stat-row">
            <span className="label">Casualty Risk:</span>
            <span className={`value status-${impact?.casualties?.toLowerCase()}`}>{impact?.casualties || 'UNKNOWN'}</span>
          </div>
          <div className="stat-row">
            <span className="label">Displacement:</span>
            <span className="value text-warning">{impact?.displacement || 'Stable'}</span>
          </div>
          <div className="shortages-list" style={{ marginTop: '10px' }}>
             <div className="label" style={{ fontSize: '0.7rem', opacity: 0.6 }}>IMPACTED RESOURCES:</div>
             <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                {impact?.shortages?.map((s, i) => (
                    <span key={i} className="chip">{s}</span>
                ))}
             </div>
          </div>
        </div>

        <div className="impact-section" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '15px' }}>
          <h4>Infrastructure Status</h4>
          <div className="stat-row">
            <span className="label">Condition:</span>
            <span className="value">{infra?.status || 'Active'}</span>
          </div>
          <div className="chokepoints" style={{ marginTop: '10px' }}>
             <div className="label" style={{ fontSize: '0.7rem', opacity: 0.6 }}>CRITICAL CHOKEPOINTS:</div>
             <ul style={{ paddingLeft: '15px', margin: '4px 0', fontSize: '0.8rem' }}>
                {infra?.chokepoints?.map((c, i) => (
                    <li key={i}>{c}</li>
                ))}
             </ul>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
