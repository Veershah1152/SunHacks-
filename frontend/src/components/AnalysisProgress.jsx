import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const STEPS = [
  { id: 'ingesting',      label: 'INGEST'   },
  { id: 'detecting',      label: 'DETECT'   },
  { id: 'scoring',        label: 'SCORE'    },
  { id: 'trending',       label: 'TREND'    },
  { id: 'simulating',     label: 'SIM'      },
  { id: 'impacting',      label: 'IMPACT'   },
  { id: 'infrastructure', label: 'INFRA'    },
  { id: 'briefing',       label: 'BRIEF'    },
];

export default function AnalysisProgress({ currentStep, complete }) {
  const [elapsed, setElapsed] = useState(0);
  const currentIdx = STEPS.findIndex(s => s.id === currentStep);

  useEffect(() => {
    if (complete) return;
    const start = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - start) / 1000), 200);
    return () => clearInterval(t);
  }, [complete]);

  return (
    <div className="analysis-progress">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            style={{ width: 14, height: 14, border: '2px solid rgba(0,210,255,0.2)', borderTopColor: 'var(--primary)', borderRadius: '50%' }}
          />
          <span className="control-label" style={{ marginBottom: 0 }}>Pipeline Active</span>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.62rem', fontWeight: 700, color: 'var(--primary)' }}>
          {elapsed.toFixed(1)}s
        </span>
      </div>

      <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
        {STEPS.map((step, i) => {
          const isDone   = i < currentIdx || complete;
          const isActive = i === currentIdx && !complete;
          return (
            <div 
              key={step.id} 
              style={{ 
                flex: 1, 
                height: '4px', 
                background: isDone ? 'var(--risk-low)' : isActive ? 'var(--primary)' : 'rgba(255,255,255,0.06)',
                borderRadius: '1px',
                boxShadow: isActive ? '0 0 8px var(--primary)' : 'none',
                opacity: (isDone || isActive) ? 1 : 0.3
              }} 
            />
          );
        })}
      </div>
      <div style={{ marginTop: '8px', textAlign: 'center' }}>
        <span style={{ fontSize: '0.6rem', fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          {complete ? 'Analysis Terminal' : `Vectoring: ${STEPS[currentIdx]?.label || 'INIT'}`}
        </span>
      </div>

    </div>
  );
}
