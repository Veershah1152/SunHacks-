import React, { useState, useEffect } from 'react';
import { useIntelligence } from './context/IntelligenceContext';
import { useAuth } from './context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Bell, Settings, Search, CheckCircle, Moon, Sun } from 'lucide-react';

import ControlPanel from './components/ControlPanel';
import StrategicBriefCard from './components/StrategicBriefCard';
import RiskCard from './components/RiskCard';
import SignalsCard from './components/SignalsCard';
import ImpactCard from './components/ImpactCard';
import ScenariosCard from './components/ScenariosCard';
import LanguageSwitcher from './components/LanguageSwitcher';
import AnalysisProgress from './components/AnalysisProgress';

const ConflictMap = React.lazy(() => import('./components/ConflictMap'));
const TrendChart = React.lazy(() => import('./components/TrendChart'));

export default function Dashboard() {
  const { user } = useAuth();
  const [theme, setTheme] = useState('light');
  const [currentView, setCurrentView] = useState('analysis');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const {
    query, setQuery, result, setResult, setTrends, trends, loading, updating, error,
    handleAnalyze, handleUpdate, cache, analysisStep
  } = useIntelligence();
  const { t } = useTranslation();

  return (
    <div className="vertex-shell">
      
      {/* ── Navbar ── */}
      <header className="top-navbar">
        <div className="nav-left">
          <div className="nav-brand">ConflictIntel</div>
          <nav className="nav-links">
            <span className={`nav-link ${currentView === 'analysis' ? 'active' : ''}`} onClick={() => setCurrentView('analysis')}>Analysis</span>
            <span className={`nav-link ${currentView === 'history' ? 'active' : ''}`} onClick={() => setCurrentView('history')}>History</span>
          </nav>
        </div>
        <div className="nav-right">
          <button className="nav-icon-btn" onClick={toggleTheme} title="Toggle Theme">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button className="nav-icon-btn"><Bell size={18} /></button>
          <button className="nav-icon-btn"><Settings size={18} /></button>
          <img src={user?.picture || 'https://via.placeholder.com/32'} alt="Profile" className="profile-img" />
          <LanguageSwitcher />
        </div>
      </header>

      {/* ── Main Viewport ── */}
      <main className="vertex-main">
        
        {/* ── Left Sidebar Control Area ── */}
        <aside className="left-feed">
          <div className="intel-card">
            <h4 style={{ fontWeight: 800, marginBottom: '8px' }}>Conflict Prediction System</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '24px' }}>Input a geographic region or conflict zone to generate an autonomous, multi-agent predictive intelligence report.</p>
            
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px' }}>Target Region</div>
            
            <ControlPanel
              query={query}
              onQueryChange={setQuery}
              onAnalyze={handleAnalyze}
              onUpdate={handleUpdate}
              loading={loading}
              updating={updating}
            />

            <AnimatePresence>
              {loading && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '24px' }}>
                  <AnalysisProgress currentStep={analysisStep} complete={!!result} />
                </motion.div>
              )}
            </AnimatePresence>
            
            {error && (
              <div style={{ padding: '12px', background: '#fef2f2', color: '#ef4444', borderRadius: '8px', fontSize: '0.8rem', marginTop: '16px' }}>
                {error}
              </div>
            )}
          </div>
        </aside>

        {/* ── Main Grid Dashboard or History View ── */}
        <div className="intel-grid">
          
          {currentView === 'history' ? (
            <div className="col-12">
              <h2 style={{ marginBottom: '24px' }}>Analysis History</h2>
              {Object.keys(cache || {}).length === 0 ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                   No history found. Run an analysis to build your session intelligence log.
                </div>
              ) : (
                <div className="history-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {Object.entries(cache).map(([key, data]) => {
                    const searchTerm = key.split('_')[0] || key;
                    const r = data.result;
                    return (
                      <div key={key} className="intel-card" style={{ cursor: 'pointer' }} onClick={() => {
                         setQuery(searchTerm);
                         setResult(data.result);
                         setTrends(data.trends);
                         setCurrentView('analysis');
                      }}>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 800 }}>Session Log</div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{searchTerm.toUpperCase()}</h4>
                        {r && <div className="risk-badge" style={{ background: 'var(--surface-mid)', color: 'var(--text-primary)', border: '1px solid var(--outline-border)', width: 'fit-content' }}>Location: {r.location}</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : !result && !loading ? (
            <div className="col-12" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '600px' }}>
              <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', maxWidth: '400px' }}>
                <div style={{ position: 'relative', width: '80px', height: '80px', margin: '0 auto 24px' }}>
                  <Search size={48} style={{ opacity: 0.1, position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }} />
                  <div style={{ position: 'absolute', inset: 0, border: '2px dashed var(--outline-border)', borderRadius: '50%', animation: 'spin 10s linear infinite' }} />
                </div>
                <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Intelligence Core Offline</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>Initialize target region in the sidebar to begin autonomous news ingestion and conflict modeling.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Row 1: High Level Brief (Full Width) */}
              <div className="col-12 intel-card" style={{ background: 'var(--surface-low)' }}>
                <StrategicBriefCard result={result} loading={loading} />
              </div>

              {/* Row 2: Quantifiable Metrics (Split View) */}
              <RiskCard result={result} loading={loading} />
              
              <div className="intel-card" style={{ display: 'flex', flexDirection: 'column' }}>
                <div className="card-label">Assessment Confidence</div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>
                      {((result?.confidence || 0.5) * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Statistical Reliability</div>
                </div>
              </div>

              {/* Row 3: Signals (Full Width) */}
              <div className="col-12 intel-card">
                 <SignalsCard result={result} loading={loading} />
              </div>

              {/* Row 4: Impact & Scenarios (Split View) */}
              <ScenariosCard result={result} loading={loading} />
              <ImpactCard result={result} loading={loading} />

              {/* Row 5: Geospatial Intelligence (Full Width) */}
              <div className="col-12" style={{ height: '500px', borderRadius: '16px', overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
                 <React.Suspense fallback={<div className="skeleton" style={{ height: '100%' }} />}>
                  <ConflictMap
                    location={result?.location}
                    lat={result?.latitude}
                    lng={result?.longitude}
                    risk={result?.risk}
                    hotspots={result?.hotspots}
                    theme={theme}
                  />
                </React.Suspense>
              </div>
            </>
          )}

        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="app-footer">
        <div>© 2024 CONFLICT PREDICTION SYSTEM. ALL RIGHTS RESERVED.</div>
        <div className="app-footer-links">
          <span>Security Protocol</span>
          <span>API Documentation</span>
          <span>Data Sovereignty</span>
        </div>
      </footer>
    </div>
  );
}
