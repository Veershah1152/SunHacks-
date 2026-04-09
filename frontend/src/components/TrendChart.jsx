import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export default function TrendChart({ data }) {
  if (!data || data.length < 2) return null

  // Map risk levels to numerical values for the chart
  const riskMap = { LOW: 1, MEDIUM: 2, HIGH: 3 }
  const chartData = data.map(d => ({
    time: new Date(d.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    riskScore: riskMap[d.risk] || 0,
    confidence: d.confidence * 100
  }))

  return (
    <div className="card trend-card">
      <div className="card-header">
        <h3>📈 Risk Trajectory</h3>
        <p className="subtitle">Historical analysis snapshots for this query</p>
      </div>
      <div style={{ width: '100%', height: 250, marginTop: '1rem' }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
            <XAxis dataKey="time" stroke="#888" fontSize={10} />
            <YAxis hide domain={[0, 4]} />
            <Tooltip 
              contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
              itemStyle={{ fontSize: '12px' }}
            />
            <Line 
              type="monotone" 
              dataKey="riskScore" 
              stroke="#00e676" 
              strokeWidth={3} 
              dot={{ r: 4 }} 
              activeDot={{ r: 6 }}
              name="Risk Level (1-3)"
            />
            <Line 
              type="monotone" 
              dataKey="confidence" 
              stroke="#2196f3" 
              strokeWidth={2} 
              strokeDasharray="5 5"
              name="Confidence %"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
