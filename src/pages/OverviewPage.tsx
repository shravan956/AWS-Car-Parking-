import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useParking } from '../context/ParkingContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Car,
  CheckCircle2,
  Clock,
  Layers,
  Percent,
  Radio,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { stats, events, setSelectedSlot, slots, lastRefreshed, triggerManualEvent } = useParking();

  // Pie chart data for current occupancy distribution
  const occupancyPieData = [
    { name: 'Available', value: stats.availableSlots, color: '#16a34a' },
    { name: 'Occupied', value: stats.occupiedSlots, color: '#dc2626' },
    { name: 'Reserved', value: stats.reservedSlots, color: '#d97706' },
    { name: 'Offline', value: stats.unknownSlots, color: '#64748b' },
  ].filter((item) => item.value > 0);

  // Floor occupancy data for bar chart
  const floorBarData = stats.floors.map((f) => ({
    name: f.floorId,
    fullName: f.name,
    Occupied: f.occupied,
    Available: f.available,
    Reserved: f.reserved,
  }));

  const recentEvents = events.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-Time AWS IoT Badge and Manual Trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-navy-900 to-slate-900 rounded-xl p-5 text-white shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping-subtle" />
            <span className="text-xs font-semibold tracking-wider uppercase text-blue-400">
              AWS IoT Core Live Telemetry Feed
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
              Active Stream
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">SmartPark Facility Command Center</h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Real-time multi-level parking telemetry with 30 ultrasonic IoT sensors across Floor 1, Floor 2, and Floor 3.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={triggerManualEvent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Zap className="w-4 h-4 text-amber-300" />
            <span>Simulate Traffic Event</span>
          </button>
          <button
            onClick={() => navigate('/live-parking')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer"
          >
            <span>Live Grid</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Top Summary Cards (Total, Available, Occupied, Reserved, Occupancy Rate) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        <StatCard
          title="Total Slots"
          value={stats.totalSlots}
          subtitle="Fixed capacity: 3 Floors"
          icon={Layers}
          variant="slate"
          badge="30 Fixed"
          onClick={() => navigate('/live-parking')}
        />
        <StatCard
          title="Available Bays"
          value={stats.availableSlots}
          subtitle={`${Math.round((stats.availableSlots / stats.totalSlots) * 100)}% vacant`}
          icon={CheckCircle2}
          variant="green"
          badge="Green (Free)"
          onClick={() => navigate('/live-parking')}
        />
        <StatCard
          title="Occupied Bays"
          value={stats.occupiedSlots}
          subtitle={`${stats.occupancyRate}% bays in use`}
          icon={Car}
          variant="red"
          badge="Red (Parked)"
          onClick={() => navigate('/live-parking')}
        />
        <StatCard
          title="Reserved Bays"
          value={stats.reservedSlots}
          subtitle="VIP & Reserved slots"
          icon={Clock}
          variant="amber"
          badge="Amber (Hold)"
          onClick={() => navigate('/live-parking')}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          subtitle="Facility load factor"
          icon={Percent}
          variant="blue"
          badge={stats.occupancyRate > 75 ? 'Heavy Load' : 'Moderate'}
          onClick={() => navigate('/analytics')}
        />
      </div>

      {/* 2. Floor-wise Breakdown Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-brand-600" />
            <span>Floor-Wise Occupancy</span>
          </h3>
          <span className="text-xs text-slate-500">10 slots per floor</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.floors.map((floor) => (
            <div
              key={floor.floorId}
              onClick={() => navigate('/live-parking')}
              className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle hover:border-slate-300 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{floor.name}</h4>
                  <span className="text-xs font-mono text-slate-500">{floor.floorId}</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {floor.occupancyRate}% full
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 my-2.5 overflow-hidden flex">
                <div
                  className="bg-rose-500 h-full transition-all duration-300"
                  style={{ width: `${(floor.occupied / floor.totalSlots) * 100}%` }}
                  title={`Occupied: ${floor.occupied}`}
                />
                <div
                  className="bg-amber-400 h-full transition-all duration-300"
                  style={{ width: `${(floor.reserved / floor.totalSlots) * 100}%` }}
                  title={`Reserved: ${floor.reserved}`}
                />
                <div
                  className="bg-emerald-500 h-full transition-all duration-300"
                  style={{ width: `${(floor.available / floor.totalSlots) * 100}%` }}
                  title={`Available: ${floor.available}`}
                />
              </div>

              {/* Floor stats counters */}
              <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Available</span>
                  <span className="font-bold text-emerald-600">{floor.available}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Occupied</span>
                  <span className="font-bold text-rose-600">{floor.occupied}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Reserved</span>
                  <span className="font-bold text-amber-600">{floor.reserved}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Middle Section: Distribution Donut Chart + Floor Comparison Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Occupancy Donut Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Current Facility Distribution</h3>
              <p className="text-xs text-slate-500">Live breakdown of 30 slots</p>
            </div>
            <span className="text-xs font-mono text-slate-400">Total: 30</span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={occupancyPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {occupancyPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span className="text-slate-600">Available:</span>
              <span className="font-bold text-slate-900">{stats.availableSlots}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span className="text-slate-600">Occupied:</span>
              <span className="font-bold text-slate-900">{stats.occupiedSlots}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-slate-600">Reserved:</span>
              <span className="font-bold text-slate-900">{stats.reservedSlots}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <span className="text-slate-600">Offline:</span>
              <span className="font-bold text-slate-900">{stats.unknownSlots}</span>
            </div>
          </div>
        </div>

        {/* Floor Comparison Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle lg:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Floor Utilization Comparison</h3>
              <p className="text-xs text-slate-500">Live slot occupancy across Floor 1, Floor 2, and Floor 3</p>
            </div>
            <button
              onClick={() => navigate('/analytics')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={floorBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="Occupied" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Available" fill="#16a34a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Reserved" fill="#d97706" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-600" /> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-600" /> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Reserved
            </span>
          </div>
        </div>
      </div>

      {/* 4. Bottom Section: Recent Activity Feed + Sensor Health Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Parking Activity */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-brand-600" />
                <span>Live Event Stream</span>
              </h3>
              <p className="text-xs text-slate-500">Real-time arrival and departure telemetry</p>
            </div>
            <button
              onClick={() => navigate('/activity-logs')}
              className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Event</th>
                  <th className="py-2.5 px-3">Vehicle Plate</th>
                  <th className="py-2.5 px-3">State Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEvents.map((evt) => (
                  <tr key={evt.eventId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => {
                          const slot = slots.find((s) => s.slotId === evt.slotId);
                          if (slot) setSelectedSlot(slot);
                        }}
                        className="font-mono font-bold text-brand-700 hover:underline"
                      >
                        {evt.slotId}
                      </button>
                      <span className="text-[10px] text-slate-400 block">{evt.floorId}</span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-semibold text-slate-800">
                        {evt.eventType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">
                      {evt.vehicleId || '---'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] capitalize text-slate-500">{evt.previousStatus}</span>
                        <span className="text-slate-300">→</span>
                        <StatusBadge status={evt.newStatus} size="sm" showIcon={false} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sensor Health & Quick Links */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-subtle flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Radio className="w-4 h-4 text-brand-600" />
                <span>IoT Sensor Fleet Health</span>
              </h3>
              <span className="text-xs font-mono text-slate-500">30 Devices</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-md bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-emerald-900">Online & Active</span>
                </div>
                <span className="font-bold text-emerald-700 text-sm">{stats.sensorsOnline}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-slate-50 border border-slate-200 text-xs">
                <span className="text-slate-600">Signal Degraded (&lt; -80 dBm)</span>
                <span className="font-semibold text-slate-800">{stats.sensorsDegraded}</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-md bg-rose-50 border border-rose-200 text-xs">
                <span className="text-rose-700 font-medium">Offline / Disconnected</span>
                <span className="font-bold text-rose-600">{stats.sensorsOffline}</span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex justify-between">
                <span>Protocol:</span>
                <span className="font-mono text-slate-800">MQTT over TLS</span>
              </div>
              <div className="flex justify-between">
                <span>Broker:</span>
                <span className="font-mono text-slate-800">AWS IoT Core</span>
              </div>
              <div className="flex justify-between">
                <span>Last telemetry sync:</span>
                <span className="font-mono text-slate-800">{lastRefreshed.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate('/iot-devices')}
            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors"
          >
            <span>Manage All 30 IoT Sensors</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
