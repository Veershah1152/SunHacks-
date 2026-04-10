import React from 'react';
import { useIntelligence } from './context/IntelligenceContext';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import ControlPanel from './components/ControlPanel';
import StrategicBriefCard from './components/StrategicBriefCard';
import AnalysisProgress from './components/AnalysisProgress';
import RiskCard from './components/RiskCard';
import SignalsCard from './components/SignalsCard';
import ConflictMap from './components/ConflictMap';
import ImpactCard from './components/ImpactCard';
import ScenariosCard from './components/ScenariosCard';
import SourcesCard from './components/SourcesCard';
import TrendChart from './components/TrendChart';

export default function Dashboard() {
  const {
    query, setQuery, result, trends, loading, updating, error,
    status, analysisStep, handleAnalyze, handleUpdate
  } = useIntelligence();

  return (
    <div className="app-container" style={{ overflowY: 'auto', display: 'block' }}>
      <main className="main-content" style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 20px 100px' }}>

        {/* Header Section */}
        <header style={{ marginBottom: '60px', textAlign: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="tactical-header" style={{ fontSize: '3rem', marginBottom: '12px', background: 'linear-gradient(to bottom, #fff, #7a8089)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Autonomous Intelligence and Conflict Prediction System
            </h1>
            <p style={{ color: '#7a8089', fontSize: '1.1rem', letterSpacing: '0.02em' }}>
              Kinetic Sentinel — Multi-Agent OSINT Intelligence Pipeline
            </p>
          </motion.div>
        </header>

        {/* Input Section */}
        <section style={{ marginBottom: '48px', maxWidth: '900px', margin: '0 auto 48px' }}>
          <ControlPanel
            query={query}
            onQueryChange={setQuery}
            onAnalyze={handleAnalyze}
            onUpdate={handleUpdate}
            loading={loading}
            updating={updating}
          />
        </section>

        {/* Analysis Status */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginBottom: '48px' }}
            >
              <AnalysisProgress currentStep={analysisStep} complete={!!result} />
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="kinetic-card" style={{ marginBottom: '48px', borderColor: 'var(--risk-high)', color: 'var(--risk-high)', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Intelligence Layers (Single Page Flow) */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>

            {/* Top Layer: Briefing & Trajectory */}
            <div className="intelligence-grid">
              <div className="span-8">
                <StrategicBriefCard result={result} loading={loading} />
              </div>
              <div className="span-4">
                <TrendChart data={trends} result={result} />
              </div>
            </div>

            {/* Middle Layer: Risk & Geospatial */}
            <div className="intelligence-grid">
              <div className="span-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <RiskCard result={result} loading={loading} />
                <ImpactCard result={result} loading={loading} />
              </div>
              <div className="span-8" style={{ minHeight: '500px' }}>
                <ConflictMap
                  location={result?.location}
                  lat={result?.latitude}
                  lng={result?.longitude}
                  risk={result?.risk}
                  hotspots={result?.hotspots}
                />
              </div>
            </div>

            {/* Bottom Layer: Specialized Analysis */}
            <div className="intelligence-grid">
              <div className="span-6">
                <SignalsCard result={result} loading={loading} />
              </div>
              <div className="span-6">
                <ScenariosCard result={result} loading={loading} />
              </div>
            </div>

            {/* Source Audit */}
            <div className="span-12">
              <SourcesCard result={result} loading={loading} />
            </div>

          </div>
        ) : !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="kinetic-card"
            style={{ textAlign: 'center', padding: '100px 40px', background: 'rgba(255,255,255,0.02)' }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '24px', opacity: 0.3 }}>🛰️</div>
            <h2 style={{ marginBottom: '16px', fontFamily: 'var(--font-head)' }}>Awaiting Intelligence Uplink</h2>
            <p style={{ color: '#7a8089', maxWidth: '500px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.6' }}>
              Input a target region or geopolitical conflict to initiate the multi-agent reasoning pipeline and generate a comprehensive tactical report.
            </p>
          </motion.div>
        )}

      </main>

      {/* Subtle Bottom Glow */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--primary), transparent)',
        opacity: loading || updating ? 1 : 0.2,
        transition: 'var(--transition-smooth)'
      }} />
    </div>
  );
}
