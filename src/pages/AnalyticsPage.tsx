import React, { useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Car,
  Activity,
  Layers,
  Info,
  Calendar,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const { stats, events, slots } = useParking();

  // 24-hour occupancy trend data
  const trend24h = useMemo(() => {
    const hours = [
      '00:00', '02:00', '04:00', '06:00', '08:00', '10:00',
      '12:00', '14:00', '16:00', '18:00', '20:00', '22:00',
    ];
    // Realistic curve peaking around 14:00 - 18:00
    const baseOccupancies = [12, 10, 8, 20, 55, 78, 85, 92, 88, 75, 48, 25];

    return hours.map((hour, idx) => {
      // Modulate slightly based on current live occupancy rate
      const currentFactor = stats.occupancyRate / 60;
      const calculated = Math.min(100, Math.max(5, Math.round(baseOccupancies[idx] * (0.8 + 0.4 * currentFactor))));
      return {
        time: hour,
        occupancyRate: calculated,
        occupiedBays: Math.round((calculated / 100) * 30),
      };
    });
  }, [stats.occupancyRate]);

  // Hourly traffic activity (entries vs exits)
  const trafficActivity = [
    { hour: '08:00', entries: 14, exits: 2 },
    { hour: '10:00', entries: 18, exits: 6 },
    { hour: '12:00', entries: 12, exits: 11 },
    { hour: '14:00', entries: 15, exits: 14 },
    { hour: '16:00', entries: 9, exits: 17 },
    { hour: '18:00', entries: 6, exits: 22 },
    { hour: '20:00', entries: 4, exits: 15 },
  ];

  // Distribution chart data
  const distributionData = [
    { name: 'Available', value: stats.availableSlots, color: '#16a34a' },
    { name: 'Occupied', value: stats.occupiedSlots, color: '#dc2626' },
    { name: 'Reserved', value: stats.reservedSlots, color: '#d97706' },
    { name: 'Offline', value: stats.unknownSlots, color: '#64748b' },
  ].filter((d) => d.value > 0);

  // Floor comparison
  const floorComparison = stats.floors.map((f) => ({
    floor: f.floorId,
    name: f.name,
    OccupancyPercent: f.occupancyRate,
    OccupiedSlots: f.occupied,
    AvailableSlots: f.available,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
              Telemetry Analytics & AWS Athena Insights
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Facility Utilization & Demand Trends
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Aggregated utilization metrics, hourly turnover volume, and multi-level floor comparisons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200">
            Demo Historical Model
          </span>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle border-l-4 border-l-blue-600">
          <span className="text-xs font-semibold uppercase text-slate-500">Live Occupancy</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">{stats.occupancyRate}%</div>
          <span className="text-[11px] text-slate-500">{stats.occupiedSlots} of 30 slots occupied</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle border-l-4 border-l-emerald-600">
          <span className="text-xs font-semibold uppercase text-slate-500">Peak Demand Hour</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">14:00 - 16:00</div>
          <span className="text-[11px] text-slate-500">92% average peak capacity</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle border-l-4 border-l-amber-500">
          <span className="text-xs font-semibold uppercase text-slate-500">Average Dwell Time</span>
          <div className="text-2xl font-bold text-amber-600 mt-1">1h 45m</div>
          <span className="text-[11px] text-slate-500">Turnover factor 3.8 cars/day</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle border-l-4 border-l-slate-600">
          <span className="text-xs font-semibold uppercase text-slate-500">Fleet Uptime</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            {Math.round((stats.sensorsOnline / stats.totalSlots) * 100)}%
          </div>
          <span className="text-[11px] text-slate-500">
            {stats.sensorsOnline}/30 sensors online
          </span>
        </div>
      </div>

      {/* Chart 1: 24-Hour Occupancy Trend (Area Chart) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>24-Hour Occupancy Trend (%)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Historical hourly utilization pattern across all 30 parking slots
            </p>
          </div>
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
            Current: {stats.occupancyRate}%
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend24h} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#64748b' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
              <Tooltip
                formatter={(val: any) => [`${val}%`, 'Occupancy Rate']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#cbd5e1',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="occupancyRate"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorOccupancy)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row: Hourly Turnover Bar Chart & Floor Comparison Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Turnover Volume */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Car className="w-4 h-4 text-emerald-600" />
                <span>Hourly Vehicle Turnover (Entries vs Exits)</span>
              </h3>
              <p className="text-xs text-slate-500">Volume of cars arriving and departing</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trafficActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="entries" name="Entries (Parked)" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exits" name="Exits (Vacated)" fill="#dc2626" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Floor Utilization Comparison */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-600" />
                <span>Floor-Wise Occupancy (%)</span>
              </h3>
              <p className="text-xs text-slate-500">Floor 1 (Ground) vs Floor 2 vs Floor 3</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={floorComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="floor" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748b' }} unit="%" />
                <Tooltip
                  formatter={(val: any) => [`${val}%`, 'Occupancy Rate']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar
                  dataKey="OccupancyPercent"
                  name="Occupancy %"
                  fill="#3b82f6"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
