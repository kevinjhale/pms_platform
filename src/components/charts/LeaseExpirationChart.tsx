'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LeaseExpirationChartProps {
  data: {
    expiringIn30Days: number;
    expiringIn60Days: number;
    expiringIn90Days: number;
  };
}

export function LeaseExpirationChart({ data }: LeaseExpirationChartProps) {
  // Calculate non-cumulative values (30 days is just those, 60 is 31-60, 90 is 61-90)
  const in30 = data.expiringIn30Days;
  const in60 = data.expiringIn60Days - data.expiringIn30Days;
  const in90 = data.expiringIn90Days - data.expiringIn60Days;

  const chartData = [
    { name: '0-30 days', count: in30, color: '#ef4444' },
    { name: '31-60 days', count: in60, color: '#f59e0b' },
    { name: '61-90 days', count: in90, color: '#22c55e' },
  ];

  const total = in30 + in60 + in90;
  if (total === 0) {
    return (
      <div style={{
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--secondary)'
      }}>
        No leases expiring in 90 days
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: 200 }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
          />
          <Tooltip
            formatter={(value) => {
              const v = Number(value) || 0;
              return `${v} lease${v !== 1 ? 's' : ''}`;
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Bar dataKey="count" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
