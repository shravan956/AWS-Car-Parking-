import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { FloorId, SlotStatus, ParkingSlot } from '../types/parking';
import { ParkingBayCard } from '../components/parking/ParkingBayCard';
import { ParkCarModal } from '../components/parking/ParkCarModal';
import {
  Layers,
  Filter,
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Sparkles,
  Info,
} from 'lucide-react';

export const LiveParkingPage: React.FC = () => {
  const { slots, setSelectedSlot, vacateSlot, searchQuery, setSearchQuery } = useParking();

  const [selectedFloor, setSelectedFloor] = useState<FloorId | 'ALL'>('F1');
  const [statusFilter, setStatusFilter] = useState<SlotStatus | 'ALL' | 'offline'>('ALL');
  const [modalSlot, setModalSlot] = useState<ParkingSlot | null>(null);

  // Filter slots
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Floor filter
      if (selectedFloor !== 'ALL' && slot.floorId !== selectedFloor) {
        return false;
      }

      // Status filter
      if (statusFilter === 'offline') {
        if (slot.sensorOnline) return false;
      } else if (statusFilter !== 'ALL' && slot.status !== statusFilter) {
        return false;
      }

      // Search query (slotId or vehicle plate)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesSlot = slot.slotId.toLowerCase().includes(query);
        const matchesPlate = slot.vehicleId?.toLowerCase().includes(query);
        const matchesSensor = slot.sensorId.toLowerCase().includes(query);
        if (!matchesSlot && !matchesPlate && !matchesSensor) return false;
      }

      return true;
    });
  }, [slots, selectedFloor, statusFilter, searchQuery]);

  // Counts for filters
  const currentFloorSlots = selectedFloor === 'ALL' ? slots : slots.filter((s) => s.floorId === selectedFloor);
  const countAvailable = currentFloorSlots.filter((s) => s.status === 'available').length;
  const countOccupied = currentFloorSlots.filter((s) => s.status === 'occupied').length;
  const countReserved = currentFloorSlots.filter((s) => s.status === 'reserved').length;
  const countOffline = currentFloorSlots.filter((s) => !s.sensorOnline || s.status === 'unknown').length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Real-Time Facility Grid
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Live Multi-Level Parking Bays
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Color Guide: <span className="text-emerald-700 font-bold">● Green = Available</span> |{' '}
            <span className="text-rose-700 font-bold">● Red = Occupied</span> |{' '}
            <span className="text-amber-700 font-bold">● Amber = Reserved</span> |{' '}
            <span className="text-slate-600 font-bold">● Grey = Offline</span>
          </p>
        </div>

        {/* Quick Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bay ID or plate..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
          />
        </div>
      </div>

      {/* Floor Selection Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'F1', label: 'Floor 1 (Ground)', subtitle: '10 Bays' },
            { id: 'F2', label: 'Floor 2 (Mid-Level)', subtitle: '10 Bays' },
            { id: 'F3', label: 'Floor 3 (Rooftop / EV)', subtitle: '10 Bays' },
            { id: 'ALL', label: 'All 3 Floors', subtitle: '30 Bays Total' },
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
          <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200">
            {countAvailable} Free
          </span>
          <span className="px-2 py-1 rounded bg-rose-100 text-rose-800 font-semibold border border-rose-200">
            {countOccupied} Occupied
          </span>
          {countReserved > 0 && (
            <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
              {countReserved} Reserved
            </span>
          )}
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2 bg-white p-3 rounded-lg border border-slate-200 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-slate-400 font-semibold text-[11px] uppercase flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter Status:</span>
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Bays ({currentFloorSlots.length})
          </button>

          <button
            onClick={() => setStatusFilter('available')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'available'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Available ({countAvailable})</span>
          </button>

          <button
            onClick={() => setStatusFilter('occupied')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'occupied'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <Car className="w-3 h-3" />
            <span>Occupied ({countOccupied})</span>
          </button>

          <button
            onClick={() => setStatusFilter('reserved')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'reserved'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Reserved ({countReserved})</span>
          </button>

          <button
            onClick={() => setStatusFilter('offline')}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              statusFilter === 'offline'
                ? 'bg-slate-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-300'
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Offline Sensor ({countOffline})</span>
          </button>
        </div>

        <div className="text-slate-400 text-xs">
          Showing <span className="font-bold text-slate-700">{filteredSlots.length}</span> of{' '}
          {currentFloorSlots.length} bays
        </div>
      </div>

      {/* Parking Garage Bay Grid */}
      {filteredSlots.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
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
            className="mt-3 px-3.5 py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {filteredSlots.map((slot) => (
            <ParkingBayCard
              key={slot.slotId}
              slot={slot}
              onSelect={setSelectedSlot}
              onQuickPark={setModalSlot}
              onVacate={vacateSlot}
            />
          ))}
        </div>
      )}

      {/* Modal for Parking with custom plate */}
      <ParkCarModal slot={modalSlot} onClose={() => setModalSlot(null)} />
    </div>
  );
};
