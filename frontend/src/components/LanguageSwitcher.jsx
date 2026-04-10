import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

const languages = [
  { code: 'en', name: 'ENGLISH', flag: '🇺🇸' },
  { code: 'es', name: 'ESPAÑOL', flag: '🇪🇸' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div style={{ padding: '0 24px 20px 24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em', marginBottom: '4px' }}>
        LANGUAGE SELECT
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        {languages.map((lang) => (
          <motion.button
            key={lang.code}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => i18n.changeLanguage(lang.code)}
            style={{
              flex: 1,
              background: i18n.language === lang.code ? 'rgba(0, 243, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)',
              border: `1px solid ${i18n.language === lang.code ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)'}`,
              borderRadius: '4px',
              padding: '8px 4px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '1rem' }}>{lang.flag}</span>
            <span style={{ 
              fontSize: '0.55rem', 
              fontWeight: 700, 
              color: i18n.language === lang.code ? 'var(--primary)' : 'rgba(255, 255, 255, 0.4)',
              letterSpacing: '0.05em'
            }}>
              {lang.name}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
