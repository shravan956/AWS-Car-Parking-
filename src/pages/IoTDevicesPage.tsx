import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { FloorId, SlotStatus, ParkingSlot } from '../types/parking';
import {
  Radio,
  Search,
  RefreshCw,
  ExternalLink,
  Layers,
  Database,
  AlertTriangle,
} from 'lucide-react';

export const IoTDevicesPage: React.FC = () => {
  const {
    slots,
    selectedSlot,
    setSelectedSlot,
    refreshNow,
    awsConfig,
    isLoading,
    isInitialLoading,
    apiError,
  } = useParking();

  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState<FloorId | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<SlotStatus | 'ALL'>('ALL');

  // Filtered devices directly from real DynamoDB slot items
  const filteredDevices = useMemo(() => {
    return slots.filter((slot) => {
      if (floorFilter !== 'ALL' && slot.floorId !== floorFilter) return false;
      if (statusFilter !== 'ALL' && slot.status !== statusFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchId = slot.deviceId ? slot.deviceId.toLowerCase().includes(q) : false;
        const matchSlot = slot.slotId ? slot.slotId.toLowerCase().includes(q) : false;
        if (!matchId && !matchSlot) return false;
      }

      return true;
    });
  }, [slots, floorFilter, statusFilter, search]);

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-800">Loading IoT Device Inventory</h3>
          <p className="text-xs text-slate-500 mt-1">Retrieving hardware telemetry mappings from AWS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* API Error State Banner */}
      {apiError && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-xl p-4 text-xs text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-sm text-rose-800">AWS Data Source Unreachable</div>
              <p className="text-rose-700 mt-0.5 text-[11px] leading-relaxed">
                Could not fetch device inventory from DynamoDB table.
              </p>
              <p className="font-mono text-[10px] bg-rose-100 text-rose-900 p-1 rounded mt-1 inline-block">
                {apiError}
              </p>
            </div>
          </div>
          <button
            onClick={refreshNow}
            disabled={isLoading}
            className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shrink-0 flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Radio className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-blue-500" />
              <span>DynamoDB &bull; {awsConfig.dynamoDbTable}</span>
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            IoT Device Fleet Inventory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified device telemetry mappings from DynamoDB table {awsConfig.dynamoDbTable} ({awsConfig.region}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={refreshNow}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Poll Telemetry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Floor filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'F1', 'F2', 'F3'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFloorFilter(f)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  floorFilter === f
                    ? 'bg-white text-slate-900 font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f === 'ALL' ? 'All Floors' : f}
              </button>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                statusFilter === 'ALL' ? 'bg-white text-slate-900 font-bold shadow-2xs' : 'text-slate-600'
              }`}
            >
              All ({slots.length})
            </button>
            <button
              onClick={() => setStatusFilter('available')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                statusFilter === 'available' ? 'bg-emerald-600 text-white font-bold' : 'text-emerald-700'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('occupied')}
              className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                statusFilter === 'occupied' ? 'bg-rose-600 text-white font-bold' : 'text-rose-700'
              }`}
            >
              Occupied
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
            placeholder="Search device ID (e.g. device-015)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Verified Devices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Device ID (Partition Key)</th>
                <th className="py-3 px-4">Assigned Slot</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Reported Status</th>
                <th className="py-3 px-4">Binary Occupancy</th>
                <th className="py-3 px-4">Last Telemetry Time</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDevices.map((slot: ParkingSlot) => (
                <tr key={slot.deviceId || slot.slotId || Math.random()} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {slot.deviceId}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-blue-600">
                    {slot.slotId || <span className="text-slate-400 italic font-normal">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {slot.floorName || (slot.floor ? `Floor ${slot.floor}` : 'N/A')}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={slot.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-700">
                    {slot.occupancy != null ? slot.occupancy : '---'}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                    {slot.lastUpdated ? new Date(slot.lastUpdated).toLocaleString() : 'null (None)'}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setSelectedSlot(slot)}
                      className="px-2.5 py-1 rounded text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
