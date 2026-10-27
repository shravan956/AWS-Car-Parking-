import React from 'react';
import { ParkingSlot } from '../../types/parking';
import { StatusBadge } from '../common/StatusBadge';
import {
  Car,
  CheckCircle2,
  Clock,
  Info,
} from 'lucide-react';

interface ParkingBayCardProps {
  slot: ParkingSlot;
  onSelect: (slot: ParkingSlot) => void;
}

export const ParkingBayCard: React.FC<ParkingBayCardProps> = ({ slot, onSelect }) => {
  const isOccupied = slot.status === 'occupied';
  const isAvailable = slot.status === 'available';
  const isReserved = slot.status === 'reserved';

  const theme = {
    available: {
      cardBg: 'bg-emerald-50/50 hover:bg-emerald-50/90',
      border: 'border-emerald-300 hover:border-emerald-500',
      shadow: 'hover:shadow-emerald-100',
      headerBg: 'bg-emerald-100/70 text-emerald-900 border-b-emerald-200',
      slotIdBg: 'bg-emerald-600 text-white',
      accentColor: 'text-emerald-700',
    },
    occupied: {
      cardBg: 'bg-rose-50/50 hover:bg-rose-50/90',
      border: 'border-rose-300 hover:border-rose-500',
      shadow: 'hover:shadow-rose-100',
      headerBg: 'bg-rose-100/70 text-rose-900 border-b-rose-200',
      slotIdBg: 'bg-rose-600 text-white',
      accentColor: 'text-rose-700',
    },
    reserved: {
      cardBg: 'bg-amber-50/50 hover:bg-amber-50/90',
      border: 'border-amber-300 hover:border-amber-500',
      shadow: 'hover:shadow-amber-100',
      headerBg: 'bg-amber-100/70 text-amber-900 border-b-amber-200',
      slotIdBg: 'bg-amber-600 text-white',
      accentColor: 'text-amber-700',
    },
    unknown: {
      cardBg: 'bg-slate-50 hover:bg-slate-100/80',
      border: 'border-slate-300 hover:border-slate-400',
      shadow: 'hover:shadow-slate-100',
      headerBg: 'bg-slate-200/70 text-slate-800 border-b-slate-200',
      slotIdBg: 'bg-slate-600 text-white',
      accentColor: 'text-slate-600',
    },
  }[slot.status] || {
    cardBg: 'bg-slate-50',
    border: 'border-slate-300',
    shadow: '',
    headerBg: 'bg-slate-200 text-slate-800 border-b-slate-200',
    slotIdBg: 'bg-slate-600 text-white',
    accentColor: 'text-slate-600',
  };

  const displaySlotId = slot.slotId || 'Unassigned';
  const displayFloor = slot.floorId || (slot.floor ? `Floor ${slot.floor}` : 'N/A');

  return (
    <div
      onClick={() => onSelect(slot)}
      className={`group relative rounded-xl border-2 ${theme.border} ${theme.cardBg} shadow-xs ${theme.shadow} transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer`}
    >
      {/* Top Header Bar */}
      <div className={`flex items-center justify-between px-3.5 py-2.5 border-b ${theme.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold tracking-wide ${theme.slotIdBg}`}>
            {displaySlotId}
          </span>
          <span className="text-xs font-semibold text-slate-600">
            {displayFloor}
          </span>
        </div>
        <StatusBadge status={slot.status} size="sm" />
      </div>

      {/* Main Bay Area with Clear Visual State */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {isOccupied ? (
          <div className="bg-white/90 rounded-lg border border-rose-200 p-3 shadow-2xs text-center">
            <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2">
              <Car className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-rose-700 tracking-wide block">
              OCCUPIED
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Slot is currently in use
            </span>
          </div>
        ) : isAvailable ? (
          <div className="bg-white/90 rounded-lg border border-emerald-200 p-3 shadow-2xs text-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-emerald-700 tracking-wide block">
              AVAILABLE
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Ready for parking
            </span>
          </div>
        ) : isReserved ? (
          <div className="bg-white/90 rounded-lg border border-amber-200 p-3 shadow-2xs text-center">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-sm text-amber-700 tracking-wide block">
              RESERVED
            </span>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Hold status active
            </span>
          </div>
        ) : (
          <div className="bg-white/90 rounded-lg border border-slate-200 p-3 shadow-2xs text-center">
            <span className="font-bold text-xs text-slate-600 tracking-wide block">
              STATUS UNKNOWN
            </span>
            <span className="text-[11px] text-slate-400 mt-1 block">
              No recent telemetry
            </span>
          </div>
        )}

        {/* Footer timestamp and details link */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
          <span className="flex items-center gap-1 font-mono text-[10px] text-slate-400 truncate">
            {slot.lastUpdated ? (
              <>
                <Clock className="w-3 h-3 shrink-0" />
                <span>{new Date(slot.lastUpdated).toLocaleTimeString()}</span>
              </>
            ) : (
              <span>No timestamp</span>
            )}
          </span>

          <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:underline">
            <Info className="w-3.5 h-3.5" />
            <span>Details</span>
          </span>
        </div>
      </div>
    </div>
  );
};
