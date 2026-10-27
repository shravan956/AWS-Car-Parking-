import React from 'react';
import { useParking } from '../context/ParkingContext';
import {
  BarChart3,
  TrendingUp,
  Layers,
  Info,
  CheckCircle2,
  Car,
  Percent,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { stats, slots } = useParking();

  // Distribution chart data based on actual slots
  const distributionData = [
    { name: 'Available', value: stats.availableSlots, color: '#16a34a' },
    { name: 'Occupied', value: stats.occupiedSlots, color: '#dc2626' },
  ].filter((d) => d.value > 0);

  // Floor comparison based on actual verified floor records
  const floorComparison = stats.floors.map((f) => ({
    floor: f.floorId,
    name: f.name,
    Occupied: f.occupied,
    Available: f.available,
    Total: f.totalSlots,
    Rate: f.occupancyRate,
  }));

  const safeTotal = stats.totalSlots > 0 ? stats.totalSlots : 1;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Live Capacity Analysis
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Facility Occupancy Breakdown
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time capacity distribution calculated directly from active DynamoDB records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold border border-blue-200">
            Live Telemetry Only
          </span>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-500">Total Capacity</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.totalSlots} Slots</div>
          <span className="text-[11px] text-slate-500">Across 3 parking floors</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-500">Available Slots</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats.availableSlots} Free</div>
          <span className="text-[11px] text-slate-500">
            {Math.round((stats.availableSlots / safeTotal) * 100)}% available
          </span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle border-l-4 border-l-rose-600">
          <span className="text-xs font-semibold uppercase text-slate-500">Occupied Slots</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats.occupiedSlots} In Use</div>
          <span className="text-[11px] text-slate-500">{stats.occupancyRate}% occupancy load</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle border-l-4 border-l-slate-600">
          <span className="text-xs font-semibold uppercase text-slate-500">Active Floors</span>
          <div className="text-2xl font-bold text-slate-800 mt-1">{stats.floors.length} Levels</div>
          <span className="text-[11px] text-slate-500">F1 (Ground), F2, F3</span>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Floor-by-Floor Comparison Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Floor Utilization Comparison</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time available vs occupied slots per floor.
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={floorComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="floor" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="Available" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Occupied" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-emerald-600" />
              <span className="text-slate-600 font-medium">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-rose-600" />
              <span className="text-slate-600 font-medium">Occupied</span>
            </div>
          </div>
        </div>

        {/* Current Distribution Donut Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>Overall Occupancy Proportion</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Real-time facility-wide ratio of occupied vs available slots.
            </p>
          </div>

          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Slots`, name]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-extrabold text-slate-900">{stats.occupancyRate}%</span>
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                Occupancy
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-600" />
              <span className="text-slate-700 font-medium">{stats.availableSlots} Available</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-600" />
              <span className="text-slate-700 font-medium">{stats.occupiedSlots} Occupied</span>
            </div>
          </div>
        </div>
      </div>

      {/* S3 Archival Note */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800 block">Historical Analytics Architecture Note</span>
          <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">
            Historical time-series trend analysis (hourly turnover volume, diurnal demand patterns, and peak day modeling)
            requires verified S3 telemetry log storage. The current dashboard presents live telemetry directly from AWS DynamoDB.
          </p>
        </div>
      </div>
    </div>
  );
};
