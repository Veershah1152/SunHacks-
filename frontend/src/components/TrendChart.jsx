import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const RISK_NUM_COLOR = (n) => n >= 70 ? '#c31e00' : n >= 40 ? '#ffa000' : '#00de72';
const RISK_LEVEL_MAP = { LOW: 33, MEDIUM: 55, HIGH: 80 };

// Custom tooltip
const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#1f2021',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      padding: '10px 14px',
      fontSize: '0.75rem',
      fontFamily: "'Space Grotesk', sans-serif",
    }}>
      <div style={{ color: '#7a8089', marginBottom: '6px' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, fontWeight: 700 }}>
          {(p.name === 'Risk Score') ? t('charts.risk_score') : (p.name === 'Confidence') ? t('charts.confidence') : p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.name.includes('%') ? 1 : 0) : p.value}
          {p.name === 'Confidence' ? '%' : ''}
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ data, result }) {
  const { t } = useTranslation();
  const hasHistory = data && data.length >= 2;

  // ── Build chart data ─────────────────────────────────────────────────────
  let chartData = [];

  if (hasHistory) {
    // Historical trend from DB records
    chartData = data.map(d => ({
      time: new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      risk: d.risk_numerical ?? RISK_LEVEL_MAP[d.risk] ?? 50,
      confidence: Math.round((d.confidence ?? 0.5) * 100),
    }));
  } else if (result) {
    // Single result — synthesize a mini bar chart from the analysis components
    const riskNum = result.risk_numerical ?? RISK_LEVEL_MAP[result.risk] ?? 50;
    const conf    = Math.round((result.confidence ?? 0.5) * 100);
    const traj    = result.trajectory || 'STABLE';

    chartData = [
      { label: t('charts.risk_score'), value: riskNum, fill: RISK_NUM_COLOR(riskNum), max: 100 },
      { label: t('charts.confidence'), value: conf,     fill: '#00d2ff',              max: 100 },
      {
        label: t('charts.trajectory'),
        value: traj === 'ESCALATING' ? 80 : traj === 'DE-ESCALATING' ? 20 : 50,
        fill: traj === 'ESCALATING' ? '#c31e00' : traj === 'DE-ESCALATING' ? '#00de72' : '#ffa000',
        max: 100
      },
    ];
  }

  // ── No data at all ────────────────────────────────────────────────────────
  if (chartData.length === 0) {
    return (
      <div className="intel-card" style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.2 }}>📈</div>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
          {t('charts.run_metrics_prompt')}
        </div>
      </div>
    );
  }

  // ── Single-result: Bar Chart ──────────────────────────────────────────────
  if (!hasHistory) {
    return (
      <div className="intel-card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-label" style={{ marginBottom: 0 }}>
            {t('intel.scorecard_title')}
          </span>
          <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>{t('charts.more_analyses_prompt')}</span>
        </div>

        {/* Manual bar chart for single result */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '16px', padding: '8px 0' }}>
          {chartData.map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{item.label.toUpperCase()}</span>
                <span style={{ fontWeight: 800, color: item.fill }}>
                  {item.label === t('charts.trajectory')
                    ? (result?.trajectory ? t(`risk.${result.trajectory.toLowerCase().replace('-', '_')}_short`, { defaultValue: result.trajectory }) : t('risk.stable'))
                    : `${item.value}${item.label === t('charts.risk_score') ? '/100' : '%'}`
                  }
                </span>
              </div>
              <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${(item.value / item.max) * 100}%`,
                    background: `linear-gradient(90deg, ${item.fill}99, ${item.fill})`,
                    borderRadius: '4px',
                    boxShadow: `0 0 10px ${item.fill}66`,
                    transition: 'width 0.8s ease',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Historical: Area Chart ────────────────────────────────────────────────
  return (
    <div className="intel-card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="card-label" style={{ marginBottom: 0 }}>
          {t('intel.trajectory_over_time')}
        </span>
        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)' }}>{chartData.length} {t('charts.snapshots')}</span>
      </div>

      <div style={{ flex: 1, width: '100%' }}>
        <ResponsiveContainer>
          <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
            <defs>
              <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="confGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--risk-low)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--risk-low)" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis 
              dataKey="time"
              stroke="rgba(255,255,255,0.4)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis hide domain={[0, 100]} />
            <ReferenceLine y={70} stroke="var(--risk-high-on)" strokeOpacity={0.4} strokeDasharray="4 4" label={{ value: t('risk.high'), fill: 'var(--risk-high-on)', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={30} stroke="var(--risk-low-dim)" strokeOpacity={0.4} strokeDasharray="4 4" label={{ value: t('risk.low'),  fill: 'var(--risk-low-dim)', fontSize: 10, position: 'insideBottomRight' }} />
            <Tooltip content={<CustomTooltip t={t} />} />
            <Area
              type="monotone"
              dataKey="risk"
              stroke="var(--primary)"
              strokeWidth={2.5}
              fill="url(#riskGrad)"
              dot={{ r: 4, fill: 'var(--primary)', strokeWidth: 0 }}
              activeDot={{ r: 6, strokeWidth: 0 }}
              name="Risk Score"
            />
            <Area
              type="monotone"
              dataKey="confidence"
              stroke="var(--risk-low-dim)"
              strokeWidth={1.5}
              fill="url(#confGrad)"
              strokeDasharray="5 5"
              dot={false}
              name="Confidence"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
