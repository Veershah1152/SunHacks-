import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, Shield, Target, FileText, CheckCircle, Clock } from 'lucide-react'

const steps = [
  { id: 'ingesting',      label: 'INGEST',   icon: Activity },
  { id: 'detecting',      label: 'DETECT',   icon: Shield },
  { id: 'scoring',        label: 'SCORE',     icon: Target },
  { id: 'trending',       label: 'TREND',    icon: Activity },
  { id: 'simulating',     label: 'SIM',  icon: Target },
  { id: 'impacting',      label: 'IMPACT',      icon: Shield },
  { id: 'infrastructure', label: 'INFRA',       icon: Target },
  { id: 'briefing',       label: 'BRIEF',    icon: FileText },
]

export default function AnalysisProgress({ currentStep, complete }) {
  const [time, setTime] = useState(0)
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  useEffect(() => {
    if (complete) return
    
    const start = Date.now()
    const timer = setInterval(() => {
      setTime((Date.now() - start) / 1000)
    }, 100)

    return () => clearInterval(timer)
  }, [complete])

  return (
    <div className="kinetic-card" style={{ padding: '32px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ 
              width: '24px', 
              height: '24px', 
              border: '2px solid var(--primary-container)', 
              borderTopColor: 'var(--primary)', 
              borderRadius: '50%' 
            }}
          />
          <h3 style={{ fontFamily: 'var(--font-head)', fontSize: '1rem', letterSpacing: '0.05em', color: 'var(--primary)' }}>
            AI INTELLIGENCE PIPELINE ACTIVE
          </h3>
        </div>
        <div style={{ 
          fontFamily: 'var(--font-head)', 
          fontWeight: 700, 
          color: 'var(--primary)', 
          background: 'var(--primary-container)', 
          padding: '6px 12px', 
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={14} />
          <span>{time.toFixed(1)}S</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', position: 'relative', zIndex: 2 }}>
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentIndex
          const isDone = index < currentIndex || complete

          return (
            <div key={step.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '50%', 
                background: isDone ? 'var(--primary)' : isActive ? 'var(--primary-container)' : 'var(--surface-low)',
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--glass-border)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDone ? 'var(--on-primary)' : isActive ? 'var(--primary)' : '#4a5568',
                transition: 'all 0.4s ease',
                boxShadow: isActive ? '0 0 15px var(--primary-container)' : 'none'
              }}>
                {isDone ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span style={{ 
                fontSize: '0.65rem', 
                fontWeight: 800, 
                color: isDone || isActive ? 'white' : '#4a5568',
                letterSpacing: '0.05em'
              }}>
                {step.label}
              </span>
            </div>
          )
        })}
        {/* Connector Line Background */}
        <div style={{ 
          position: 'absolute', 
          top: '18px', 
          left: '5%', 
          width: '90%', 
          height: '1px', 
          background: 'var(--glass-border)', 
          zIndex: -1 
        }} />
      </div>
      
      {!complete && (
        <div style={{ 
          height: '4px', 
          width: '100%', 
          background: 'var(--surface-low)', 
          marginTop: '32px', 
          borderRadius: '2px',
          overflow: 'hidden',
          position: 'relative'
        }}>
          <motion.div 
            style={{ 
              height: '100%', 
              background: 'var(--primary)', 
              boxShadow: '0 0 10px var(--primary)' 
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
            transition={{ duration: 1 }}
          />
        </div>
      )}
    </div>
  )
}
