import React from 'react';
import { useTranslation } from 'react-i18next';


const EXAMPLE_QUERIES = ['Sudan conflict', 'Gaza ceasefire', 'Ukraine war', 'Myanmar crisis', 'Sahel region'];

export default function ControlPanel({ query, onQueryChange, onAnalyze, onUpdate, loading, updating }) {
  const { t } = useTranslation();
  const handleKey = (e) => { if (e.key === 'Enter' && !loading && query.trim()) onAnalyze(); };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Input Area */}
      <div>
        <div className="input-wrap">
          <span className="input-icon" style={{ opacity: loading ? 0.3 : 0.6, transition: 'all 0.3s', top: '16px', transform: 'none' }}>
            {loading ? '⚡' : '◈'}
          </span>
          <textarea
            id="conflict-query"
            className="vertex-input"
            rows="3"
            placeholder={loading ? t('system.analysing_target') : "Enter Region, Country, or specific topic..."}

            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={handleKey}
            disabled={loading}
            style={{ 
              paddingLeft: '44px',
              paddingTop: '16px',
              borderColor: loading ? 'var(--primary)' : 'var(--outline-border)',
              display: 'block'
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

      {/* Quick Access Tags */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {EXAMPLE_QUERIES.map((q) => (
            <button 
              key={q} 
              className="topic-chip" 
              onClick={() => onQueryChange(q)} 
            >
              {q}
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
