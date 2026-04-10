import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from './context/AuthContext';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

export default function LoginPage() {
  const { loginWithGoogle, loginWithCredentials, registerWithCredentials } = useAuth();
  const { t } = useTranslation();
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tempError, setTempError] = useState('');

  const handleSuccess = async (credentialResponse) => {
    const success = await loginWithGoogle(credentialResponse.credential);
    if (!success) {
      setTempError("Intelligence authorization failed. Access denied.");
    }
  };

  const handleCredentialSubmit = async (e) => {
    e.preventDefault();
    setTempError('');
    if (!email || !password || (isRegistering && !name)) {
      setTempError("Missing required fields.");
      return;
    }

    if (isRegistering) {
      const res = await registerWithCredentials(name, email, password);
      if (res.success) {
        setIsRegistering(false);
        setTempError("Registration successful. You may now log in.");
        setTimeout(() => setTempError(''), 3000);
      } else {
        setTempError(res.error);
      }
    } else {
      const res = await loginWithCredentials(email, password);
      if (!res.success) {
        setTempError(res.error);
      }
    }
  };

  const inputStyle = {
    width: '100%',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: 'white',
    padding: '12px',
    marginBottom: '12px',
    borderRadius: '4px',
    outline: 'none',
    fontFamily: 'var(--font-sans)'
  };

  const buttonStyle = {
    width: '100%',
    background: 'var(--primary)',
    color: 'black',
    border: 'none',
    padding: '12px',
    fontWeight: 'bold',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '8px',
    fontFamily: 'var(--font-sans)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  };

  return (
    <div className="vertex-shell" style={{ 
      height: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      background: 'radial-gradient(circle at center, #1b1c1d 0%, #0a0b0c 100%)',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Background Kinetic Elements */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, pointerEvents: 'none' }}>
        <div className="grid-bg" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="intel-card" 
        style={{ 
          maxWidth: '420px', 
          width: '90%', 
          padding: '48px', 
          textAlign: 'center',
          backdropFilter: 'blur(32px) saturate(180%)',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <motion.div 
            animate={{ scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{ 
              fontSize: '3rem', 
              color: 'var(--primary)',
              textShadow: '0 0 20px var(--primary-dim)',
              marginBottom: '16px'
            }}
          >
            ◈
          </motion.div>
          <h1 style={{ 
            fontSize: '1.2rem', fontFamily: 'var(--font-display)', 
            letterSpacing: '0.2em', color: 'white', margin: '0 0 8px 0', fontWeight: 800
          }}>
            {t('system.logo_text')} {t('login.command_center', { defaultValue: 'COMMAND' })}
          </h1>
          <p style={{ 
            fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', 
            letterSpacing: '0.1em', margin: 0
          }}>
            {t('system.tagline')}
          </p>
        </div>

        <LanguageSwitcher />

        <div style={{ 
          height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)', 
          margin: '32px 0' 
        }} />

        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '24px' }}>
            {t('login.instruction')}
          </p>
          
          {tempError && (
             <div style={{ background: 'rgba(255,0,0,0.1)', color: '#ff6b6b', padding: '10px', fontSize: '0.8rem', borderRadius: '4px', marginBottom: '16px' }}>
               {tempError}
             </div>
          )}

          <form onSubmit={handleCredentialSubmit} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {isRegistering && (
              <input 
                style={inputStyle} 
                type="text" 
                placeholder={t('login.agent_name')} 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            )}
            <input 
              style={inputStyle} 
              type="email" 
              placeholder={t('login.email_address')} 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            <input 
              style={inputStyle} 
              type="password" 
              placeholder={t('login.security_key')} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
            />
            <button type="submit" style={buttonStyle}>
              {isRegistering ? t('login.register_access') : t('login.credentials_login')}
            </button>
          </form>

          <div style={{ margin: '24px 0', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
            {t('login.or')}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => alert('Connection to Google Auth failed.')}
              theme="filled_black"
              shape="square"
              size="large"
              text="continue_with"
              width="320"
            />
          </div>
          
          <div style={{ marginTop: '24px', fontSize: '0.8rem', color: 'var(--primary)', cursor: 'pointer' }}
               onClick={() => {
                 setIsRegistering(!isRegistering);
                 setTempError('');
               }}>
            {isRegistering ? t('login.already_cleared') : t('login.register_prompt')}
          </div>
        </div>

        <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.2)', letterSpacing: '0.05em' }}>
          {t('metadata.secure_channel')}
        </div>
      </motion.div>

      {/* Aesthetic corner accents */}
      <div style={{ position: 'absolute', top: '40px', left: '40px', fontSize: '0.6rem', color: 'var(--primary)', opacity: 0.3, fontFamily: 'var(--font-display)' }}>
        {t('metadata.status_online')}
      </div>
      <div style={{ position: 'absolute', bottom: '40px', right: '40px', fontSize: '0.6rem', color: 'var(--primary)', opacity: 0.3, fontFamily: 'var(--font-display)' }}>
        {t('metadata.early_warning')}
      </div>
    </div>
  );
}
