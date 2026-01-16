'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PMRevenueChartProps {
  data: {
    monthName: string;
    totalCollected: number;
    pmShare: number;
  }[];
  height?: number;
}

export function PMRevenueChart({ data, height = 300 }: PMRevenueChartProps) {
  const formatCurrency = (value: number) =>
    `$${(value / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="monthName"
            tick={{ fontSize: 12 }}
            tickLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
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
          <Bar
            dataKey="totalCollected"
            fill="#94a3b8"
            name="Total Collected"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="pmShare"
            fill="#22c55e"
            name="Your Share"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
