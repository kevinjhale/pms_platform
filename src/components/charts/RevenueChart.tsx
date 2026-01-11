'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: {
    month: string;
    expected: number;
    collected: number;
  }[];
  height?: number;
}

export function RevenueChart({ data, height = 300 }: RevenueChartProps) {
  const formatCurrency = (value: number) =>
    `$${(value / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            formatter={(value) => formatCurrency(Number(value) || 0)}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="expected"
            stroke="#94a3b8"
            strokeWidth={2}
            dot={{ fill: '#94a3b8', strokeWidth: 0, r: 3 }}
            name="Expected"
          />
          <Line
            type="monotone"
            dataKey="collected"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 0, r: 3 }}
            name="Collected"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
