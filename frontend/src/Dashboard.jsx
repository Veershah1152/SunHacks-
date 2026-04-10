import React from 'react';
import { useIntelligence } from './context/IntelligenceContext';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';


import { FileText, Speaker, Zap } from 'lucide-react';
import ControlPanel from './components/ControlPanel';
import StrategicBriefCard from './components/StrategicBriefCard';
import AnalysisProgress from './components/AnalysisProgress';
import RiskCard from './components/RiskCard';
import SignalsCard from './components/SignalsCard';
import ImpactCard from './components/ImpactCard';
import ScenariosCard from './components/ScenariosCard';
import SourcesCard from './components/SourcesCard';
import LanguageSwitcher from './components/LanguageSwitcher';

// Lazy load heavy components
const ConflictMap = React.lazy(() => import('./components/ConflictMap'));
const TrendChart = React.lazy(() => import('./components/TrendChart'));


// Single-page HUD — no separate navigation required


export default function Dashboard() {
  const { user, logout } = useAuth();
  const {
    query, setQuery, result, trends, loading, updating, error,
    analysisStep, handleAnalyze, handleUpdate
  } = useIntelligence();
  const { t } = useTranslation();


  const systemState = loading ? 'busy' : updating ? 'busy' : 'online';
  const systemLabel = loading 
    ? t('system.analysing_target') 
    : updating 
      ? t('system.ingesting_feed') 
      : result 
        ? t('system.uplink_nominal') 
        : t('system.awaiting_directive');


  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

  return (
    <div className="vertex-shell crt-flicker">
      <div className="crt-overlay" />
      <div className="scanline" />

      {/* Scrolling Intel Ticker */}
      <div className="intel-ticker">
        <div className="ticker-track">
          {[1,2].map(i => (
            <React.Fragment key={i}>
              <div className="ticker-item">SIGNAL_DETECTION: {systemState.toUpperCase()}</div>
              <div className="ticker-item">NET_PROTO: TLS_1.3_V4_SECURE</div>
              <div className="ticker-item">SAT_UPLINK: ACTIVE // {now.getUTCFullYear()}-{now.getUTCMonth()+1}-{now.getUTCDate()}</div>
              <div className="ticker-item">ORBITAL_VECTOR: {Math.random().toFixed(4)}N</div>
              <div className="ticker-item">GEO_SYNC: NOMINAL</div>
              <div className="ticker-item">CORE_LOAD: {loading ? '88' : '12'}%</div>
              <div className="ticker-item">DB_STATE: PERSISTENT_SYNC</div>
              <div className="ticker-item">ENCRYPTION: AES_256_GCM</div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SIDEBAR — Persistent Intelligence Control
      ══════════════════════════════════════════════ */}
      <aside className="vertex-sidebar">
        {/* Logo Section */}
        <div className="sidebar-header" style={{ padding: '28px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, right: 0, padding: '4px 8px', fontSize: '0.5rem', fontFamily: 'monospace', color: 'var(--primary)', opacity: 0.3, borderBottom: '1px solid var(--primary)', borderLeft: '1px solid var(--primary)' }}>
            v2.4.0-STABLE
          </div>
          <div className="sidebar-logo">
            <div className="logo-mark" style={{ borderRadius: '2px', background: 'var(--primary)', clipPath: 'polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)' }}>
              <Zap size={18} fill="currentColor" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="logo-text" style={{ fontSize: '1.2rem', letterSpacing: '0.15em' }}>{t('system.logo_text')}</span>
              <div style={{ width: '100%', height: '2px', background: 'linear-gradient(90deg, var(--primary), transparent)', marginTop: '2px' }} />
            </div>
          </div>
          <div className="logo-sub" style={{ paddingLeft: '48px', opacity: 0.5 }}>{t('system.title')}</div>
        </div>

        {/* System Metadata Area */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: '8px' }}>
          <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--primary)', fontWeight: 800, opacity: 0.6 }}>SECTOR</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>{query.split(' ')[0].toUpperCase() || 'GLOBAL'}</div>
          </div>
          <div style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            <div style={{ fontSize: '0.5rem', color: 'var(--primary)', fontWeight: 800, opacity: 0.6 }}>NODE_ID</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'white' }}>{Math.floor(Math.random()*9000)+1000}</div>
          </div>
        </div>

        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)', margin: '0 20px' }} />


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
              {t('system.access_level')}
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
            title={t('sidebar.terminate_session')}
          >

            ⏻
          </button>
        </div>

        {/* Core Directives */}
        <div style={{ padding: '24px 24px 12px 24px', fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>
          {t('sidebar.intel_uplink')}
        </div>

        {/* Language Selection */}
        <LanguageSwitcher />



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

          {/* Export Dossier */}
          {result && !loading && (
            <motion.button
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="btn-ghost"
              onClick={() => window.print()}
              style={{ marginTop: '12px', borderColor: 'var(--primary-dim)', color: 'var(--primary)', gap: '10px' }}
            >
              <FileText size={16} />
              {t('controls.export_dossier', { defaultValue: 'EXPORT DOSSIER' })}
            </motion.button>
          )}

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
        <div className="vertex-topbar" style={{ 
          background: 'rgba(255,255,255,0.01)', 
          padding: '16px 24px', 
          borderRadius: 'var(--radius-md)',
          border: '1px solid rgba(255,255,255,0.03)',
          marginBottom: '32px'
        }}>
          <div className="topbar-title">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <Zap size={14} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 4px var(--primary))' }} />
              <h1 style={{ fontSize: '0.85rem', margin: 0, fontWeight: 800, letterSpacing: '0.1em' }}>
                {t('system.active_session')} // <span style={{ color: 'var(--primary)' }}>{query.toUpperCase() || t('system.global_sentinel')}</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '16px', fontSize: '0.6rem', opacity: 0.4, paddingLeft: '26px' }}>
              <span>LCL: {timeStr}</span>
              <span>UTC: {now.getUTCHours()}:{now.getUTCMinutes().toString().padStart(2,'0')}</span>
              <span style={{ color: 'var(--primary)', opacity: 0.8 }}>LATENCY: 42MS</span>
            </div>
          </div>

          <div className="topbar-meta" style={{ gap: '24px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.55rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '4px' }}>SIGNAL_STRENGTH</div>
              <div style={{ width: '120px', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: loading ? '80%' : '100%' }}
                  className="crt-flicker"
                  style={{ height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} 
                />
              </div>
            </div>
            <div className="meta-tag">
              <span style={{ opacity: 0.4, marginRight: '6px' }}>{t('metadata.model')}</span> LLAMA 3.2
            </div>
            <div className="meta-tag" style={{ borderLeft: '2px solid var(--primary)', borderRadius: '0 100px 100px 0' }}>
              {t('system.network_secure')}
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
                  <React.Suspense fallback={<div className="skeleton" style={{ height: '320px' }} />}>
                    <TrendChart data={trends} result={result} />
                  </React.Suspense>
                </div>
              </div>

              {/* Row 2: Map (dominant) + Signals (side) */}
              <div className="intel-grid">
                <div className="col-9" style={{ minHeight: '600px' }}>
                  <React.Suspense fallback={<div className="skeleton" style={{ height: '100%' }} />}>
                    <ConflictMap
                      location={result?.location}
                      lat={result?.latitude}
                      lng={result?.longitude}
                      risk={result?.risk}
                      hotspots={result?.hotspots}
                    />
                  </React.Suspense>
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
                  {t('system.logo_text')} <span>{t('system.title').split(' ')[2]}</span>
                </h2>

                <p className="idle-body">
                  {t('dashboard.idle_body')}
                </p>

                <div className="idle-stat-row">
                  <div className="idle-stat">
                    <div className="idle-stat-label">{t('dashboard.database')}</div>
                    <div className="idle-stat-value">{t('dashboard.persistent')}</div>
                  </div>
                  <div className="idle-stat">
                    <div className="idle-stat-label">{t('dashboard.core')}</div>
                    <div className="idle-stat-value">LLAMA-3.2</div>
                  </div>
                  <div className="idle-stat">
                    <div className="idle-stat-label">{t('dashboard.atlas')}</div>
                    <div className="idle-stat-value">{t('dashboard.synced')}</div>
                  </div>
                  <div className="idle-stat">
                    <div className="idle-stat-label">{t('dashboard.network')}</div>
                    <div className="idle-stat-value">{t('dashboard.encrypted')}</div>
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
