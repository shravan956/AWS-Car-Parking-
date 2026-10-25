import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { FloorId, DeviceStatus } from '../types/parking';
import {
  Radio,
  Wifi,
  WifiOff,
  Battery,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';

export const IoTDevicesPage: React.FC = () => {
  const { devices, toggleSensor, setSelectedSlot, slots, lastRefreshed, refreshNow } = useParking();

  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState<FloorId | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<DeviceStatus | 'ALL'>('ALL');

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      if (floorFilter !== 'ALL' && dev.floorId !== floorFilter) return false;
      if (statusFilter !== 'ALL' && dev.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchId = dev.deviceId.toLowerCase().includes(q);
        const matchSlot = dev.slotId.toLowerCase().includes(q);
        const matchMac = dev.macAddress.toLowerCase().includes(q);
        const matchType = dev.sensorType.toLowerCase().includes(q);
        if (!matchId && !matchSlot && !matchMac && !matchType) return false;
      }

      return true;
    });
  }, [devices, floorFilter, statusFilter, search]);

  const onlineCount = devices.filter((d) => d.status === 'online').length;
  const degradedCount = devices.filter((d) => d.status === 'degraded').length;
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const avgBattery = Math.round(
    devices.reduce((acc, d) => acc + d.batteryLevel, 0) / devices.length
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
              AWS IoT Device Defender & Fleet Hub
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            IoT Sensor Fleet Management
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoring all 30 ultrasonic and optical hardware telemetry nodes across 3 parking floors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            Demo Simulator Mode
          </div>
          <button
            onClick={refreshNow}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll Telemetry</span>
          </button>
        </div>
      </div>

      {/* Sensor Health Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle">
          <span className="text-xs font-semibold text-slate-400 uppercase">Total Sensors</span>
          <div className="text-2xl font-bold text-slate-900 mt-1">30 / 30</div>
          <span className="text-[11px] text-slate-500">100% bay sensor coverage</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle border-l-4 border-l-emerald-500">
          <span className="text-xs font-semibold text-emerald-700 uppercase">Online & Healthy</span>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{onlineCount}</div>
          <span className="text-[11px] text-slate-500">Telemetry reporting normal</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle border-l-4 border-l-rose-500">
          <span className="text-xs font-semibold text-rose-700 uppercase">Offline / Fault</span>
          <div className="text-2xl font-bold text-rose-600 mt-1">{offlineCount}</div>
          <span className="text-[11px] text-slate-500">Heartbeat timed out</span>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle border-l-4 border-l-blue-500">
          <span className="text-xs font-semibold text-blue-700 uppercase">Avg Battery Fleet</span>
          <div className="text-2xl font-bold text-blue-600 mt-1">{avgBattery}%</div>
          <span className="text-[11px] text-slate-500">Li-ion battery backed</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Floor filter */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value as FloorId | 'ALL')}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Floors (30)</option>
            <option value="F1">Floor 1 (10)</option>
            <option value="F2">Floor 2 (10)</option>
            <option value="F3">Floor 3 (10)</option>
          </select>

          {/* Status filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-md text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2 py-0.5 rounded font-medium ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              All ({devices.length})
            </button>
            <button
              onClick={() => setStatusFilter('online')}
              className={`px-2 py-0.5 rounded font-medium ${
                statusFilter === 'online' ? 'bg-emerald-600 text-white' : 'text-emerald-700'
              }`}
            >
              Online ({onlineCount})
            </button>
            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-2 py-0.5 rounded font-medium ${
                statusFilter === 'offline' ? 'bg-rose-600 text-white' : 'text-rose-700'
              }`}
            >
              Offline ({offlineCount})
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sensor ID, MAC, bay..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Devices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Device ID</th>
                <th className="py-3 px-4">Associated Slot</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Hardware Type</th>
                <th className="py-3 px-4">Connectivity</th>
                <th className="py-3 px-4">Signal (RSSI)</th>
                <th className="py-3 px-4">Distance Reading</th>
                <th className="py-3 px-4">Battery</th>
                <th className="py-3 px-4">Reported State</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDevices.map((dev) => {
                const isOnline = dev.status === 'online';
                return (
                  <tr key={dev.deviceId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">
                      {dev.deviceId}
                      <span className="block text-[10px] text-slate-400 font-normal font-mono">
                        {dev.macAddress}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          const slot = slots.find((s) => s.slotId === dev.slotId);
                          if (slot) setSelectedSlot(slot);
                        }}
                        className="font-mono font-bold text-brand-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>{dev.slotId}</span>
                        <ExternalLink className="w-3 h-3 text-slate-400" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{dev.floorId}</td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{dev.sensorType}</td>
                    <td className="py-3 px-4">
                      {isOnline ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold text-[11px]">
                          <Wifi className="w-3 h-3 text-emerald-600" />
                          <span>Online</span>
                        </span>
                      ) : dev.status === 'degraded' ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 font-semibold text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Degraded</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 font-semibold text-[11px]">
                          <WifiOff className="w-3 h-3 text-rose-600" />
                          <span>Offline</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">
                      {isOnline ? `${dev.rssi} dBm` : '---'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {isOnline ? `${dev.distanceCm} cm` : '0 cm (N/A)'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Battery className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-800">{dev.batteryLevel}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={dev.reportedState} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => toggleSensor(dev.slotId)}
                        title={isOnline ? 'Simulate sensor disconnect' : 'Restore sensor connection'}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                          isOnline
                            ? 'border border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold'
                        }`}
                      >
                        {isOnline ? 'Simulate Offline' : 'Reconnect'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
