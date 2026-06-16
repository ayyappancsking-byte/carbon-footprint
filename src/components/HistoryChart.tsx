import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface HistoryChartPoint {
  date: string
  total: number
}

interface HistoryChartProps {
  data: HistoryChartPoint[]
}

export default function HistoryChart({ data }: HistoryChartProps) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="date" stroke="var(--text)" style={{ fontSize: '12px' }} />
          <YAxis
            stroke="var(--text)"
            label={{ value: 't CO2e/year', angle: -90, position: 'insideLeft' }}
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: '6px',
            }}
            formatter={(value) => `${(value as number).toFixed(2)} t`}
          />
          <Line
            type="monotone"
            dataKey="total"
            stroke="var(--accent)"
            dot={{ fill: 'var(--accent)', r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
