import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'EN' },
  { code: 'es', name: 'ES' },
  { code: 'hi', name: 'HI' }
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <div style={{ display: 'flex', gap: '4px', background: 'var(--surface-low)', padding: '2px', borderRadius: '100px', border: '1px solid var(--outline-border)' }}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => i18n.changeLanguage(lang.code)}
          style={{
            background: i18n.language === lang.code ? 'var(--surface)' : 'transparent',
            border: 'none',
            borderRadius: '100px',
            padding: '4px 10px',
            fontSize: '0.65rem',
            fontWeight: 800,
            cursor: 'pointer',
            color: i18n.language === lang.code ? 'var(--primary)' : 'var(--text-tertiary)',
            boxShadow: i18n.language === lang.code ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            transition: 'var(--transition)'
          }}
        >
          {lang.name}
        </button>
      ))}
    </div>
  );
}
