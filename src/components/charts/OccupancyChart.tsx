'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface OccupancyChartProps {
  occupied: number;
  vacant: number;
  occupancyRate: number;
  height?: number;
}

export function OccupancyChart({ occupied, vacant, occupancyRate, height = 200 }: OccupancyChartProps) {
  const data = [
    { name: 'Occupied', value: occupied, color: '#22c55e' },
    { name: 'Vacant', value: vacant, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (data.length === 0) {
    return (
      <div style={{
        height: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--secondary)'
      }}>
        No units
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height, position: 'relative' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
            startAngle={90}
            endAngle={-270}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => {
              const v = Number(value) || 0;
              return [`${v} unit${v !== 1 ? 's' : ''}`, String(name)];
            }}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Center label */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>
          {occupancyRate}%
        </div>
        <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
          Occupied
        </div>
      </div>
    </div>
  );
}
