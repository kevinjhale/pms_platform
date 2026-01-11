'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PaymentStatusChartProps {
  data: {
    current: number;
    partial: number;
    delinquent: number;
    eviction: number;
  };
  height?: number;
}

const STATUS_COLORS: Record<string, string> = {
  current: '#22c55e',
  partial: '#f59e0b',
  delinquent: '#ef4444',
  eviction: '#7f1d1d',
};

const STATUS_LABELS: Record<string, string> = {
  current: 'Current',
  partial: 'Partial',
  delinquent: 'Delinquent',
  eviction: 'Eviction',
};

export function PaymentStatusChart({ data, height = 250 }: PaymentStatusChartProps) {
  const chartData = Object.entries(data)
    .filter(([_, value]) => value > 0)
    .map(([status, value]) => ({
      name: STATUS_LABELS[status] || status,
      value,
      color: STATUS_COLORS[status] || '#94a3b8',
    }));

  if (chartData.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--secondary)'
      }}>
        No payment data available
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) =>
              (percent ?? 0) > 0.05 ? `${name} (${((percent ?? 0) * 100).toFixed(0)}%)` : ''
            }
            labelLine={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => {
              const v = Number(value) || 0;
              return `${v} unit${v !== 1 ? 's' : ''}`;
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
