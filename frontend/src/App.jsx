import { useState, useCallback } from 'react'
import Header       from './components/Header.jsx'
import ControlPanel from './components/ControlPanel.jsx'
import RiskCard     from './components/RiskCard.jsx'
import SignalsCard  from './components/SignalsCard.jsx'
import ScenariosCard from './components/ScenariosCard.jsx'
import SourcesCard  from './components/SourcesCard.jsx'
import ConflictMap   from './components/ConflictMap.jsx'
import TrendChart   from './components/TrendChart.jsx'
import AnalysisProgress from './components/AnalysisProgress.jsx'
import StrategicBriefCard from './components/StrategicBriefCard.jsx'
import ImpactCard from './components/ImpactCard.jsx'
import { motion, AnimatePresence } from 'framer-motion'


const API = 'http://localhost:8000'

export default function App() {
  const [query,    setQuery]    = useState('')
  const [result,   setResult]   = useState(null)
  const [trends,   setTrends]   = useState([])
  const [loading,  setLoading]  = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error,    setError]    = useState(null)
  const [status,   setStatus]   = useState('idle') // 'idle' | 'analyzing' | 'done'
  const [analysisStep, setAnalysisStep] = useState('ingesting')


  /* ── Update (ingest) ─────────────────────────────────────── */
  const handleUpdate = useCallback(async () => {
    setUpdating(true)
    setError(null)
    try {
      const term = query.trim() || 'conflict war military protest'
      const res  = await fetch(`${API}/update?query=${encodeURIComponent(term)}`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error(`Update failed: ${res.statusText}`)
      const data = await res.json()
      setError(null)
      // Brief success message
      setStatus('updated')
      setTimeout(() => setStatus('idle'), 3000)
      console.log('[Update]', data)
    } catch (err) {
      setError(err.message)
    } finally {
      setUpdating(false)
    }
  }, [query])

  /* ── Analyze ─────────────────────────────────────────────── */
  const handleAnalyze = useCallback(async () => {
    if (!query.trim()) {
      setError('Please enter a region or conflict topic.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    setTrends([])
    setStatus('analyzing')
    setAnalysisStep('ingesting')

    const progressTimer = setInterval(() => {
      setAnalysisStep(prev => {
        const steps = ['ingesting', 'detecting', 'scoring', 'trending', 'simulating', 'impacting', 'infrastructure', 'briefing']
        const idx = steps.indexOf(prev)
        if (idx !== -1 && idx < steps.length - 1) return steps[idx + 1]
        return prev
      })
    }, 8000) // approx 60s total

    try {
      // 1. Run Analysis
      const res = await fetch(`${API}/analyze?query=${encodeURIComponent(query.trim())}`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || `Server error: ${res.status}`)
      }
      const data = await res.json()
      setResult(data)
      
      // 2. Fetch Trends
      const trendRes = await fetch(`${API}/trends?query=${encodeURIComponent(query.trim())}`)
      if (trendRes.ok) {
        const trendData = await trendRes.json()
        setTrends(trendData.trends || [])
      }

      setStatus('done')
    } catch (err) {
      setError(err.message)
      setStatus('idle')
    } finally {
      clearInterval(progressTimer)
      setLoading(false)
    }

  }, [query])

  return (
    <div className="app-wrapper">
      <Header status={status} />

      <ControlPanel
        query={query}
        onQueryChange={setQuery}
        onAnalyze={handleAnalyze}
        onUpdate={handleUpdate}
        loading={loading}
        updating={updating}
      />

      {error && (
        <div className="error-banner" role="alert">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {status === 'updated' && !error && (
        <div className="error-banner" style={{
          background: 'rgba(0,230,118,0.08)',
          border: '1px solid rgba(0,230,118,0.25)',
          color: '#00e676'
        }}>
          <span>✅</span>
          <span>Data updated successfully — new OSINT articles indexed.</span>
        </div>
      )}

      {loading && (
        <AnalysisProgress currentStep={analysisStep} complete={!!result} />
      )}

      {(loading || result) && (
        <AnimatePresence>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="results-grid"
          >
            <div style={{ gridColumn: '1 / -1' }}>
              <StrategicBriefCard result={result} loading={loading} />
            </div>
            <div className="col-left">
              <RiskCard result={result} loading={loading} />
              <ImpactCard result={result} loading={loading} />
              <TrendChart data={trends} />
            </div>
            <div className="col-right">
              <ConflictMap 
                location={result?.location} 
                lat={result?.latitude} 
                lng={result?.longitude} 
                risk={result?.risk}
                hotspots={result?.hotspots}
              />
              <SignalsCard result={result} loading={loading} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <ScenariosCard result={result} loading={loading} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <SourcesCard result={result} loading={loading} />
            </div>
          </motion.div>
        </AnimatePresence>
      )}


      {!loading && !result && status === 'idle' && (
        <div className="empty-state">
          <div className="icon">🛰️</div>
          <h3>Intelligence System Ready</h3>
          <p>
            Enter a region or conflict topic below, click{' '}
            <strong style={{ color: 'var(--accent-blue)' }}>Update Data</strong> to ingest fresh OSINT,
            then <strong style={{ color: 'var(--accent-blue)' }}>Analyze</strong> to generate your
            intelligence report.
          </p>
        </div>
      )}
    </div>
  )
}
