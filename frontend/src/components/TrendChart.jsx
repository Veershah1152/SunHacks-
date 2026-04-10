import React from 'react';
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
const CustomTooltip = ({ active, payload, label }) => {
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
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.name.includes('%') ? 1 : 0) : p.value}
          {p.name === 'Confidence' ? '%' : ''}
        </div>
      ))}
    </div>
  );
};

export default function TrendChart({ data, result }) {
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
      { label: 'Risk Score', value: riskNum, fill: RISK_NUM_COLOR(riskNum), max: 100 },
      { label: 'Confidence', value: conf,     fill: '#00d2ff',              max: 100 },
      {
        label: 'Trajectory',
        value: traj === 'ESCALATING' ? 80 : traj === 'DE-ESCALATING' ? 20 : 50,
        fill: traj === 'ESCALATING' ? '#c31e00' : traj === 'DE-ESCALATING' ? '#00de72' : '#ffa000',
        max: 100
      },
    ];
  }

  // ── No data at all ────────────────────────────────────────────────────────
  if (chartData.length === 0) {
    return (
      <div className="kinetic-card" style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontSize: '2.5rem', opacity: 0.2 }}>📈</div>
        <div style={{ fontSize: '0.75rem', color: '#7a8089', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '0.05em' }}>
          RUN ANALYSIS TO VIEW METRICS
        </div>
      </div>
    );
  }

  // ── Single-result: Bar Chart ──────────────────────────────────────────────
  if (!hasHistory) {
    return (
      <div className="kinetic-card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
            INTELLIGENCE SCORECARD
          </span>
          <span style={{ fontSize: '0.65rem', color: '#7a8089' }}>RUN MORE ANALYSES FOR TREND VIEW</span>
        </div>

        {/* Manual bar chart for single result */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', gap: '16px', padding: '8px 0' }}>
          {chartData.map((item) => (
            <div key={item.label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.75rem' }}>
                <span style={{ color: '#7a8089', fontWeight: 600 }}>{item.label.toUpperCase()}</span>
                <span style={{ fontWeight: 800, color: item.fill }}>
                  {item.label === 'Trajectory'
                    ? (result?.trajectory || 'STABLE')
                    : `${item.value}${item.label === 'Risk Score' ? '/100' : '%'}`
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
    <div className="kinetic-card" style={{ height: '320px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
          RISK TRAJECTORY OVER TIME
        </span>
        <span style={{ fontSize: '0.65rem', color: '#7a8089' }}>{chartData.length} SNAPSHOTS</span>
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
                <stop offset="5%"  stopColor="#00de72" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00de72" stopOpacity={0}   />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis 
              dataKey="time"
              stroke="#4a5568"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dy={8}
            />
            <YAxis hide domain={[0, 100]} />
            <ReferenceLine y={70} stroke="#c31e0044" strokeDasharray="4 4" label={{ value: 'HIGH', fill: '#c31e0099', fontSize: 10, position: 'insideTopRight' }} />
            <ReferenceLine y={30} stroke="#00de7244" strokeDasharray="4 4" label={{ value: 'LOW',  fill: '#00de7299', fontSize: 10, position: 'insideBottomRight' }} />
            <Tooltip content={<CustomTooltip />} />
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
              stroke="#00de72"
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
