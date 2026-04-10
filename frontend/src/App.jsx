import React from 'react';
import { IntelligenceProvider } from './context/IntelligenceContext';
import Dashboard from './Dashboard';

export default function App() {
  return (
    <IntelligenceProvider>
      <Dashboard />
    </IntelligenceProvider>
  );
}
