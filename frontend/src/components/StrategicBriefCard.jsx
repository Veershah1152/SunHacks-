import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';

const StrategicBriefCard = React.memo(function StrategicBriefCard({ result, loading }) {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  const summary = result?.summary || '';
  const reasoning = result?.reasoning || t('intel.no_reasoning', { defaultValue: 'Consensus derived from multi-agent signal analysis.' });
  const displayContent = summary ? `${summary}\n\n${reasoning}` : reasoning;

  // Typewriter effect
  useEffect(() => {
    if (loading || !result) return;
    setTypedText('');
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(displayContent.slice(0, i));
      i++;
      if (i > displayContent.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [displayContent, loading, result]);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(reasoning);
    // Attempt to match voice to current language
    const voices = window.speechSynthesis.getVoices();
    const langCode = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'es' ? 'es-ES' : 'en-US';
    const voice = voices.find(v => v.lang.startsWith(langCode));
    if (voice) utterance.voice = voice;
    
    // Set properties for a more "system" vibe
    utterance.pitch = 0.9;
    utterance.rate = 1.0;
    
    utterance.onend = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  if (loading || !result) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="intel-card accent-primary"
      style={{ height: '100%' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div className="card-label" style={{ margin: 0 }}>{t('intel.situation_report')}</div>
        <button 
          onClick={handleSpeak}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: isSpeaking ? 'var(--primary)' : 'var(--text-tertiary)', 
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            letterSpacing: '0.05em'
          }}
        >
          {isSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {isSpeaking ? 'STOP BRIEFING' : 'PLAY BRIEFING'}
        </button>
      </div>

      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute',
          left: '-24px',
          top: '0',
          bottom: '0',
          width: '2px',
          background: 'var(--primary)',
          opacity: 0.2
        }} />
        <div className="typewriter-text" style={{ 
          fontSize: '1rem', 
          lineHeight: 1.6, 
          color: 'var(--text-primary)', 
          whiteSpace: 'pre-wrap',
          minHeight: '120px',
          fontWeight: 500,
          fontStyle: 'italic',
          paddingLeft: '10px',
          marginBottom: '20px'
        }}>
          "{typedText}"<span className="crt-flicker" style={{ borderLeft: '8px solid var(--primary)', marginLeft: '4px' }}>&nbsp;</span>
        </div>

        {/* Intelligence Metrics Row */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '24px', borderTop: '1px solid var(--outline-border)', paddingTop: '16px' }}>
          <div>
            <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>{t('intel.confidence_score')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{((result.confidence || 0.5) * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>{t('intel.signal_depth')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t('intel.matched')}</div>
          </div>
          {result.sources && result.sources.length > 0 && (
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>{t('intel.evidence_footprint')}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                {result.sources.slice(0, 5).map((s, i) => {
                  const url = typeof s === 'object' ? s.url || s.link || '#' : s;
                  const title = typeof s === 'object' ? s.title || s.name : 'Source';
                  return (
                    <a key={i} href={url} target="_blank" rel="noreferrer" style={{ width: '8px', height: '8px', background: 'var(--text-tertiary)', borderRadius: '1px', display: 'block' }} title={title} />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Verification Signature */}
        <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '2px solid var(--outline-border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.6, letterSpacing: '0.1em' }}>
            {t('intel.verified_consensus')}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default StrategicBriefCard;
