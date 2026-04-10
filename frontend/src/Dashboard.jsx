import React from 'react';
import { useIntelligence } from './context/IntelligenceContext';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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

// Single-page HUD — no separate navigation required


export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    query, setQuery, result, trends, loading, updating, error,
    analysisStep, handleAnalyze, handleUpdate
  } = useIntelligence();

  const systemState = loading ? 'busy' : updating ? 'busy' : 'online';
  const systemLabel = loading ? 'ANALYSING TARGET...' : updating ? 'INGESTING FEED...' : result ? 'UPLINK NOMINAL' : 'AWAITING DIRECTIVE';

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="vertex-shell">

      {/* ══════════════════════════════════════════════
          SIDEBAR — Persistent Intelligence Control
      ══════════════════════════════════════════════ */}
      <aside className="vertex-sidebar">

        {/* Logo */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-mark">C</div>
            <span className="logo-text">CPS</span>
          </div>
          <div className="logo-sub">CONFLICT PREDICTION SYSTEM </div>
        </div>

        {/* User Profile */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(255,255,255,0.01)'
        }}>
          <img
            src={user?.picture}
            alt={user?.name}
            style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary-dim)' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name?.toUpperCase()}
            </div>
            <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Access: OMEGA
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              padding: '4px'
            }}
            title="Terminate Session"
          >
            ⏻
          </button>
        </div>

        {/* Core Directives */}
        <div style={{ padding: '24px 24px 12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          INTEL UPLINK
        </div>


        {/* Controls */}
        <div className="sidebar-controls">
          <ControlPanel
            query={query}
            onQueryChange={setQuery}
            onAnalyze={handleAnalyze}
            onUpdate={handleUpdate}
            loading={loading}
            updating={updating}
          />

          {/* Progress — shown only while loading */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AnalysisProgress currentStep={analysisStep} complete={!!result} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="error-card">
              <span>⚠</span> {error}
            </div>
          )}
        </div>

        {/* Status Footer */}
        <div className="sidebar-footer">
          <div className="status-row">
            <div className={`status-dot ${systemState}`} />
            <span className="status-text">{systemLabel}</span>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════
          MAIN VIEWPORT
      ══════════════════════════════════════════════ */}
      <main className="vertex-main">

        {/* Top Bar */}
        <div className="vertex-topbar">
          <div className="topbar-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '8px', height: '8px', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)', borderRadius: '1px' }} />
              <h1 style={{ fontSize: '0.9rem', margin: 0 }}>ACTIVE_SESSION // <span>{query.toUpperCase() || 'GLOBAL_SENTINEL'}</span></h1>
            </div>
            <p style={{ fontSize: '0.6rem', opacity: 0.4 }}>SECURE INTELLIGENCE LINK // REAL-TIME GEOPOLITICAL ANALYSIS</p>
          </div>
          <div className="topbar-meta">
            <div className="meta-tag">
              <span style={{ opacity: 0.4, marginRight: '6px' }}>MODEL</span> LLAMA 3.2
            </div>
            <div className="meta-tag">
              <span style={{ opacity: 0.4, marginRight: '6px' }}>PIPELINE</span> OSINT-AUTOSYNC
            </div>
            <div className="meta-tag" style={{ color: 'var(--primary)', borderColor: 'var(--primary-dim)' }}>
              NETWORK: SECURE
            </div>
          </div>
        </div>


        {/* Intelligence Panels */}
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="intel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
            >
              {/* Row 1: Brief (large) + Risk & Trend (stack side) */}
              <div className="intel-grid">
                <div className="col-8">
                  <StrategicBriefCard result={result} loading={loading} />
                </div>
                <div className="col-4" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <RiskCard result={result} loading={loading} />
                  <TrendChart data={trends} result={result} />
                </div>
              </div>

              {/* Row 2: Map (dominant) + Signals (side) */}
              <div className="intel-grid">
                <div className="col-9" style={{ minHeight: '600px' }}>
                  <ConflictMap
                    location={result?.location}
                    lat={result?.latitude}
                    lng={result?.longitude}
                    risk={result?.risk}
                    hotspots={result?.hotspots}
                  />
                </div>
                <div className="col-3">
                  <SignalsCard result={result} loading={loading} />
                </div>
              </div>

            </motion.div>

          ) : (
            /* ── IDLE / SCANNING STATE ── */
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="vertex-idle"
              style={{ minHeight: 'calc(100vh - 140px)' }}
            >
              {/* HUD Corner Lines */}
              <div className="idle-hud-lines">
                <div className="hud-corner tl" />
                <div className="hud-corner tr" />
                <div className="hud-corner bl" />
                <div className="hud-corner br" />
              </div>

              <div className="idle-content">
                <motion.span
                  className="idle-icon"
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                >
                  🌐
                </motion.span>

                <h2 className="idle-title">
                  CONFLICT PREDICTION <span>SYSTEM</span>
                </h2>

                <p className="idle-body">
                  Neural OSINT pipeline operational. Awaiting tactical directive
                  from primary uplink console. System primed for regional risk
                  modeling and conflict trajectory analysis.
                </p>

                <div className="idle-stat-row">
                  <div className="idle-stat">
                    <div className="idle-stat-label">Database</div>
                    <div className="idle-stat-value">PERSISTENT</div>
                  </div>
                  <div className="idle-stat">
                    <div className="idle-stat-label">Core</div>
                    <div className="idle-stat-value">LLAMA-3.2</div>
                  </div>
                  <div className="idle-stat">
                    <div className="idle-stat-label">Atlas</div>
                    <div className="idle-stat-value">SYNCED</div>
                  </div>
                  <div className="idle-stat">
                    <div className="idle-stat-label">Network</div>
                    <div className="idle-stat-value">ENCRYPTED</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom accent line — glows when active */}
      <div
        className="vertex-accent-line"
        style={{ opacity: (loading || updating) ? 1 : 0.25 }}
      />
    </div>
  );
}
