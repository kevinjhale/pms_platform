'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { MonthlyRevenueData, OccupancyMetrics } from '@/services/reports';
import type { PaymentStatusCounts, DashboardData } from '@/services/dashboard';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

interface RevenueChartCardProps {
  data: MonthlyRevenueData[];
}

export function RevenueChartCard({ data }: RevenueChartCardProps) {
  if (!data || data.length === 0) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No revenue data available</div>;
  }

  const chartData = data.map(d => ({
    month: d.month,
    collected: d.collected / 100,
    expected: d.expected / 100,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData}>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v / 1000}k`} />
        <Tooltip
          formatter={(value) => [`$${Number(value).toLocaleString()}`, '']}
          labelStyle={{ color: 'var(--foreground)' }}
        />
        <Bar dataKey="collected" fill="#22c55e" name="Collected" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expected" fill="#e5e7eb" name="Expected" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

interface OccupancyChartCardProps {
  data: OccupancyMetrics;
}

export function OccupancyChartCard({ data }: OccupancyChartCardProps) {
  if (!data || data.totalUnits === 0) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No units data available</div>;
  }

  const chartData = [
    { name: 'Occupied', value: data.occupiedUnits, color: '#22c55e' },
    { name: 'Vacant', value: data.vacantUnits, color: '#f59e0b' },
  ];

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface PaymentStatusChartCardProps {
  data: PaymentStatusCounts;
}

export function PaymentStatusChartCard({ data }: PaymentStatusChartCardProps) {
  if (!data) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No payment data available</div>;
  }

  const chartData = [
    { name: 'Current', value: data.current, color: '#22c55e' },
    { name: 'Partial', value: data.partial, color: '#f59e0b' },
    { name: 'Delinquent', value: data.delinquent, color: '#ef4444' },
  ].filter(d => d.value > 0);

  if (chartData.length === 0) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No payment data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

interface MaintenanceCategoryChartCardProps {
  data: Record<string, number>;
}

export function MaintenanceCategoryChartCard({ data }: MaintenanceCategoryChartCardProps) {
  if (!data || Object.keys(data).length === 0) {
    return <div style={{ color: 'var(--secondary)', textAlign: 'center' }}>No maintenance data available</div>;
  }

  const chartData = Object.entries(data).map(([name, value], index) => ({
    name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={70}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
