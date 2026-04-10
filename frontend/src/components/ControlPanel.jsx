import React from 'react';
import { useTranslation } from 'react-i18next';


const EXAMPLE_QUERIES = ['Sudan conflict', 'Gaza ceasefire', 'Ukraine war', 'Myanmar crisis', 'Sahel region'];

export default function ControlPanel({ query, onQueryChange, onAnalyze, onUpdate, loading, updating }) {
  const { t } = useTranslation();
  const handleKey = (e) => { if (e.key === 'Enter' && !loading && query.trim()) onAnalyze(); };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Label */}
      <div>
        <div className="control-label">{t('sidebar.intel_uplink')}</div>

        <div className="input-wrap">
          <span className="input-icon" style={{ opacity: loading ? 0.3 : 0.6, transition: 'all 0.3s' }}>
            {loading ? '⚡' : '◈'}
          </span>
          <input
            id="conflict-query"
            className="vertex-input"
            type="text"
            placeholder={loading ? t('system.analysing_target') : t('controls.placeholder')}

            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            style={{ 
              paddingLeft: '44px',
              borderColor: loading ? 'var(--primary-glow)' : '',
              boxShadow: loading ? '0 0 15px var(--primary-glow)' : ''
            }}
          />
        </div>

      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button
          className="btn-primary"
          onClick={onAnalyze}
          disabled={loading || updating || !query.trim()}
        >
          {loading ? (
            <><span style={{ animation: 'pulse 1.5s infinite' }}>⚡</span> {t('system.analysing_target')}</>
          ) : (
            <><span>⚡</span> {t('controls.analyze')}</>
          )}
        </button>

      </div>

      {/* Directives */}
      <div>
        <div className="control-label" style={{ marginBottom: '8px' }}>{t('system.active_session')}</div>

        <div className="topic-chips" style={{ gap: '4px' }}>
          {EXAMPLE_QUERIES.map((q) => (
            <button key={q} className="topic-chip" onClick={() => onQueryChange(q)} style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
              {q}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
