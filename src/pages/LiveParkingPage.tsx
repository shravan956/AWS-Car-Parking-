import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { FloorId, SlotStatus } from '../types/parking';
import { ParkingBayCard } from '../components/parking/ParkingBayCard';
import {
  Layers,
  Filter,
  Car,
  CheckCircle2,
  Search,
  RefreshCw,
  AlertTriangle,
  Info,
} from 'lucide-react';

export const LiveParkingPage: React.FC = () => {
  const {
    slots,
    selectedSlot,
    setSelectedSlot,
    searchQuery,
    setSearchQuery,
    awsConfig,
    refreshNow,
    isLoading,
    isInitialLoading,
    apiError,
  } = useParking();

  const [selectedFloor, setSelectedFloor] = useState<FloorId | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<SlotStatus | 'ALL'>('ALL');

  // Filter slots safely handling nullable slotId, deviceId
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Floor filter
      if (selectedFloor !== 'ALL' && slot.floorId !== selectedFloor) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'ALL' && slot.status !== statusFilter) {
        return false;
      }

      // Search query (slotId or deviceId)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSlot = slot.slotId ? slot.slotId.toLowerCase().includes(query) : false;
        const matchesDevice = slot.deviceId ? slot.deviceId.toLowerCase().includes(query) : false;
        if (!matchesSlot && !matchesDevice) return false;
      }

      return true;
    });
  }, [slots, selectedFloor, statusFilter, searchQuery]);

  // Counts for the active floor selection
  const currentFloorSlots =
    selectedFloor === 'ALL' ? slots : slots.filter((s) => s.floorId === selectedFloor);
  const countAvailable = currentFloorSlots.filter((s) => s.status === 'available').length;
  const countOccupied = currentFloorSlots.filter((s) => s.status === 'occupied').length;

  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-800">Loading Parking Bays</h3>
          <p className="text-xs text-slate-500 mt-1">Retrieving live slot states from AWS DynamoDB...</p>
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
                Failed to poll live parking telemetry from API Gateway. Displaying last cached data.
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

      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                awsConfig.apiStatus === 'Healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              AWS DynamoDB Live Feed &bull; {slots.length} Total Bays
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Live Parking Bays
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Color Legend: <span className="text-emerald-700 font-bold">&bull; Green = Available</span> &nbsp;|&nbsp;{' '}
            <span className="text-rose-700 font-bold">&bull; Red = Occupied</span>
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bay ID (e.g. F2-S03) or device..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Floor Selection Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Floors', subtitle: `${slots.length} Bays` },
            { id: 'F1', label: 'Floor 1 (Ground)', subtitle: '10 Bays' },
            { id: 'F2', label: 'Floor 2 (Mid-Level)', subtitle: '10 Bays' },
            { id: 'F3', label: 'Floor 3 (Rooftop / EV)', subtitle: '10 Bays' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFloor(tab.id as FloorId | 'ALL')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                selectedFloor === tab.id
                  ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-500'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Floor Quick Summary Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
            {countAvailable} Available
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-100 text-rose-800 font-bold border border-rose-200">
            {countOccupied} Occupied
          </span>
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-2xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold text-[11px] uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status:</span>
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All ({currentFloorSlots.length})
          </button>

          <button
            onClick={() => setStatusFilter('available')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Available ({countAvailable})</span>
          </button>

          <button
            onClick={() => setStatusFilter('occupied')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'occupied'
                ? 'bg-rose-600 text-white shadow-xs font-semibold'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Occupied ({countOccupied})</span>
          </button>
        </div>

        <div className="text-slate-400 text-xs">
          Showing <span className="font-bold text-slate-700">{filteredSlots.length}</span> of{' '}
          {currentFloorSlots.length} bays
        </div>
      </div>

      {/* Parking Garage Bay Grid */}
      {filteredSlots.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-subtle">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm">No Parking Bays Match Filter</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your floor or status filter, or clear your search query.
          </p>
          <button
            onClick={() => {
              setStatusFilter('ALL');
              setSelectedFloor('ALL');
              setSearchQuery('');
            }}
            className="mt-3 px-3.5 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredSlots.map((slot, idx) => (
            <ParkingBayCard
              key={slot.slotId || slot.deviceId || `slot-${idx}`}
              slot={slot}
              onSelect={setSelectedSlot}
            />
          ))}
        </div>
      )}
    </div>
  );
};
