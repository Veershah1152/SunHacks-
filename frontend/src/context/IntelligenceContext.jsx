import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * Sanitize the raw API result so no object/array leaks into a React text node.
 * Handles GeoJSON `location` objects, numeric coercions, etc.
 */
function sanitizeResult(data) {
  if (!data || typeof data !== 'object') return data;
  const d = { ...data };

  // --- location: may come as GeoJSON {type, coordinates} or plain string ---
  if (d.location && typeof d.location === 'object') {
    const loc = d.location;
    // Try GeoJSON Point: {type:'Point', coordinates:[lng, lat]}
    if (loc.type === 'Point' && Array.isArray(loc.coordinates) && loc.coordinates.length >= 2) {
      if (!d.longitude) d.longitude = parseFloat(loc.coordinates[0]) || 0;
      if (!d.latitude)  d.latitude  = parseFloat(loc.coordinates[1]) || 0;
    }
    // Fall back to any name-like field inside the object
    d.location = loc.name || loc.city || loc.country || loc.region || 'Global';
  }
  d.location = typeof d.location === 'string' ? d.location : String(d.location ?? 'Global');

  // --- Ensure lat/lng are numbers ---
  d.latitude  = parseFloat(d.latitude)  || 0;
  d.longitude = parseFloat(d.longitude) || 0;

  // --- Ensure other scalar fields are primitives ---
  const strFields = ['risk', 'trajectory', 'summary', 'reasoning'];
  strFields.forEach(k => {
    if (d[k] !== undefined && typeof d[k] !== 'string') {
      d[k] = typeof d[k] === 'object' ? JSON.stringify(d[k]) : String(d[k]);
    }
  });

  // --- Ensure signals items have safe string fields ---
  if (Array.isArray(d.signals)) {
    d.signals = d.signals.map(sig => ({
      ...sig,
      source: typeof sig.source === 'string' ? sig.source : String(sig.source ?? ''),
      text:   typeof sig.text   === 'string' ? sig.text   : String(sig.text   ?? ''),
      intensity: parseFloat(sig.intensity) || 0,
    }));
  }

  return d;
}

const IntelligenceContext = createContext(null);

const API = 'http://localhost:8000';

export function IntelligenceProvider({ children }) {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('idle');
  const [analysisStep, setAnalysisStep] = useState('ingesting');
  const [autoCycleEnabled, setAutoCycleEnabled] = useState(true);

  const handleUpdate = useCallback(async () => {
    setUpdating(true);
    setError(null);
    try {
      const term = query.trim() || 'conflict war military protest';
      const res = await fetch(`${API}/update?query=${encodeURIComponent(term)}`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error(`Update failed: ${res.statusText}`);
      setStatus('updated');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  }, [query]);

  const handleAnalyze = useCallback(async () => {
    const term = query.trim();
    if (!term) {
      setError('Please enter a region or conflict topic.');
      return;
    }


    setLoading(true);
    setError(null);
    setResult(null);
    setTrends([]);
    setStatus('analyzing');
    setAnalysisStep('ingesting');

    const steps = ['ingesting', 'detecting', 'scoring', 'trending', 'simulating', 'impacting', 'infrastructure', 'briefing'];
    let stepIndex = 0;
    const progressTimer = setInterval(() => {
      stepIndex = Math.min(stepIndex + 1, steps.length - 1);
      setAnalysisStep(steps[stepIndex]);
    }, 10000); // ~10s per step = ~80s total for 8 steps

    try {
      const res = await fetch(`${API}/analyze?query=${encodeURIComponent(term)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Server error: ${res.status}`);
      }
      const data = await res.json();
      
      let trendData = [];
      const trendRes = await fetch(`${API}/trends?query=${encodeURIComponent(term)}`);
      if (trendRes.ok) {
        const tJson = await trendRes.json();
        trendData = tJson.trends || [];
      }

      setResult(sanitizeResult(data));
      setTrends(trendData);

      setStatus('done');
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    } finally {
      clearInterval(progressTimer);
      setLoading(false);
    }
  }, [query]);

  const value = useMemo(() => ({
    query, setQuery,
    result, setResult,
    trends, setTrends,
    loading, setLoading,
    updating, setUpdating,
    error, setError,
    status, setStatus,
    analysisStep, setAnalysisStep,
    autoCycleEnabled, setAutoCycleEnabled,
    handleUpdate,
    handleAnalyze
  }), [query, result, trends, loading, updating, error, status, analysisStep, autoCycleEnabled, handleUpdate, handleAnalyze]);

  return (
    <IntelligenceContext.Provider value={value}>
      {children}
    </IntelligenceContext.Provider>
  );
}

export function useIntelligence() {
  const context = useContext(IntelligenceContext);
  if (!context) {
    throw new Error('useIntelligence must be used within an IntelligenceProvider');
  }
  return context;
}
