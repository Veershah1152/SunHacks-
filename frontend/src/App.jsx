import React from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { IntelligenceProvider } from './context/IntelligenceContext';
import { AuthProvider, useAuth } from './context/AuthContext';
const Dashboard = React.lazy(() => import('./Dashboard'));
const LoginPage = React.lazy(() => import('./LoginPage'));

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
console.log("[Auth] Google Client ID Detected:", GOOGLE_CLIENT_ID);

function AuthWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="vertex-shell" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="skeleton" style={{ width: '200px', height: '10px' }} />
      </div>
    );
  }

  return (
    <React.Suspense fallback={<div className="vertex-shell" style={{ height: '100vh' }} />}>
      {user ? <Dashboard /> : <LoginPage />}
    </React.Suspense>
  );
}

export default function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <IntelligenceProvider>
          <AuthWrapper />
        </IntelligenceProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
