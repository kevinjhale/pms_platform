'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MaintenanceCategoryChartProps {
  data: Record<string, number>;
  height?: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  appliance: 'Appliance',
  structural: 'Structural',
  pest: 'Pest',
  landscaping: 'Landscape',
  cleaning: 'Cleaning',
  security: 'Security',
  other: 'Other',
};

const CATEGORY_COLORS: Record<string, string> = {
  plumbing: '#3b82f6',
  electrical: '#f59e0b',
  hvac: '#8b5cf6',
  appliance: '#06b6d4',
  structural: '#ef4444',
  pest: '#84cc16',
  landscaping: '#22c55e',
  cleaning: '#ec4899',
  security: '#6366f1',
  other: '#94a3b8',
};

export function MaintenanceCategoryChart({ data, height = 250 }: MaintenanceCategoryChartProps) {
  const chartData = Object.entries(data)
    .map(([category, count]) => ({
      name: CATEGORY_LABELS[category] || category,
      count,
      color: CATEGORY_COLORS[category] || '#94a3b8',
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  if (chartData.length === 0) {
    return (
      <div style={{
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--secondary)'
      }}>
        No maintenance requests
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 60, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={60}
          />
          <Tooltip
            formatter={(value) => {
              const v = Number(value) || 0;
              return `${v} request${v !== 1 ? 's' : ''}`;
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
