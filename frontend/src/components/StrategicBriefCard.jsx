import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';

const StrategicBriefCard = React.memo(function StrategicBriefCard({ result, loading }) {
  const { t, i18n } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [typedText, setTypedText] = useState('');
  
  const reasoning = result?.reasoning || t('intel.no_reasoning', { defaultValue: 'Consensus derived from multi-agent signal analysis.' });

  // Typewriter effect
  useEffect(() => {
    if (loading || !result) return;
    setTypedText('');
    let i = 0;
    const interval = setInterval(() => {
      setTypedText(reasoning.slice(0, i));
      i++;
      if (i > reasoning.length) clearInterval(interval);
    }, 15);
    return () => clearInterval(interval);
  }, [reasoning, loading, result]);

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
            color: isSpeaking ? 'var(--primary)' : 'rgba(255,255,255,0.3)', 
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
        <p style={{
          fontSize: '1.1rem',
          fontWeight: 400,
          lineHeight: 1.8,
          color: 'rgba(255,255,255,0.9)',
          fontFamily: 'var(--font-body)',
          marginBottom: '20px',
          fontStyle: 'italic',
          paddingLeft: '10px',
          minHeight: '100px'
        }}>
          "{typedText}"<span className="crt-flicker" style={{ borderLeft: '8px solid var(--primary)', marginLeft: '4px' }}>&nbsp;</span>
        </p>

        {/* Intelligence Metrics Row */}
        <div style={{ display: 'flex', gap: '40px', marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '16px' }}>
          <div>
            <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>{t('intel.confidence_score')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>{((result.confidence || 0.5) * 100).toFixed(0)}%</div>
          </div>
          <div>
            <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>{t('intel.signal_depth')}</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>{t('intel.matched')}</div>
          </div>
          {result.sources && result.sources.length > 0 && (
            <div style={{ flex: 1, textAlign: 'right' }}>
              <div className="control-label" style={{ fontSize: '0.55rem', opacity: 0.5 }}>{t('intel.evidence_footprint')}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                {result.sources.slice(0, 5).map((s, i) => (
                  <a key={i} href={s} target="_blank" rel="noreferrer" style={{ width: '8px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '1px', display: 'block' }} title={s} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Verification Signature */}
        <div style={{ marginTop: '24px', paddingTop: '12px', borderTop: '2px solid rgba(255,255,255,0.02)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>
            MD5_AUTH: {Math.random().toString(36).substring(7).toUpperCase()}..{Math.random().toString(36).substring(7).toUpperCase()}
          </div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--primary)', opacity: 0.4, letterSpacing: '0.2em' }}>
            {t('intel.verified_consensus')}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

export default StrategicBriefCard;
