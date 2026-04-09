import { motion } from 'framer-motion'
import { Activity, Shield, Target, FileText, CheckCircle } from 'lucide-react'

const steps = [
  { id: 'ingesting',  label: 'Ingesting OSINT', icon: Activity },
  { id: 'detecting',  label: 'Detecting Risks', icon: Shield },
  { id: 'simulating', label: 'Simulating Cases', icon: Target },
  { id: 'reporting',  label: 'Finalising JSON', icon: FileText },
]

export default function AnalysisProgress({ currentStep, complete }) {
  const currentIndex = steps.findIndex(s => s.id === currentStep)

  return (
    <div className="analysis-progress-wrapper">
      <div className="steps-container">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = index === currentIndex
          const isDone = index < currentIndex || complete

          return (
            <div key={step.id} className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
              <div className="step-icon">
                {isDone ? <CheckCircle size={18} /> : <Icon size={18} />}
              </div>
              <span className="step-label">{step.label}</span>
              {index < steps.length - 1 && <div className="step-connector" />}
            </div>
          )
        })}
      </div>
      
      {!complete && (
        <motion.div 
          className="progress-bar-glow"
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  )
}
