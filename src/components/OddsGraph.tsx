'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GraphPoint } from '@/lib/types';
import { getHealerColor } from '@/lib/colors';

interface OddsGraphProps {
  points: GraphPoint[];
  seriesNames: string[];
  isDark: boolean;
}

const renderCustomLegend = (props: any) => {
  const { payload } = props;
  if (!payload) return null;
  return (
    <div className="mt-5 flex flex-col items-center text-sm font-semibold text-slate-650 dark:text-slate-400">
      {/* 2-column grid for the first 8 items */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 w-full max-w-md px-4">
        {payload.slice(0, 8).map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center gap-2.5">
            <span
              className="inline-block h-3 w-3 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <span className="truncate">{entry.value}</span>
          </div>
        ))}
      </div>
      {/* Center the 9th item below */}
      {payload.length > 8 && (
        <div className="flex items-center gap-2.5 mt-3">
          <span
            className="inline-block h-3 w-3 rounded-full border border-slate-300 dark:border-slate-700 shrink-0 shadow-sm"
            style={{ backgroundColor: payload[8].color }}
          />
          <span>{payload[8].value}</span>
        </div>
      )}
    </div>
  );
};

export function OddsGraph({ points, seriesNames, isDark }: OddsGraphProps) {
  if (points.length === 0) {
    return <div className="text-sm text-slate-500 dark:text-slate-400">No votes yet.</div>;
  }

  const gridStroke = isDark ? '#1e293b' : '#e2e8f0';
  const axisStroke = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';
  const tooltipTextColor = isDark ? '#f8fafc' : '#0f172a';

  return (
    <ResponsiveContainer width="100%" height={370}>
      <LineChart data={points} margin={{ top: 5, right: 5, left: -5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
        <XAxis dataKey="date" stroke={axisStroke} fontSize={12} />
        <YAxis stroke={axisStroke} fontSize={12} unit="%" domain={[0, 100]} width={45} />
        <Tooltip
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${tooltipBorder}`,
            color: tooltipTextColor,
            borderRadius: '0.25rem',
          }}
          labelStyle={{ color: isDark ? '#94a3b8' : '#64748b' }}
        />
        <Legend content={renderCustomLegend} />
        {seriesNames.map((name) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={getHealerColor(name, isDark)}
            dot={false}
            strokeWidth={2}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
