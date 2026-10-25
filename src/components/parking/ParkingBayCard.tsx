import React from 'react';
import { ParkingSlot } from '../../types/parking';
import { StatusBadge } from '../common/StatusBadge';
import {
  Car,
  Wifi,
  WifiOff,
  BatteryCharging,
  ArrowRightCircle,
  LogOut,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ParkingBayCardProps {
  slot: ParkingSlot;
  onSelect: (slot: ParkingSlot) => void;
  onQuickPark: (slot: ParkingSlot) => void;
  onVacate: (slotId: string) => void;
}

export const ParkingBayCard: React.FC<ParkingBayCardProps> = ({
  slot,
  onSelect,
  onQuickPark,
  onVacate,
}) => {
  const isOccupied = slot.status === 'occupied';
  const isAvailable = slot.status === 'available';
  const isReserved = slot.status === 'reserved';
  const isOffline = !slot.sensorOnline || slot.status === 'unknown';

  // State styling matching user requirements: Occupied = RED, Available = GREEN, Reserved = AMBER, Offline = GREY
  const theme = {
    available: {
      cardBg: 'bg-emerald-50/40 hover:bg-emerald-50/80',
      border: 'border-emerald-300 hover:border-emerald-500',
      shadow: 'hover:shadow-emerald-100',
      headerBg: 'bg-emerald-100/60 text-emerald-900 border-b-emerald-200',
      accentColor: 'text-emerald-700',
      laneColor: 'border-emerald-400',
      slotIdBg: 'bg-emerald-600 text-white',
    },
    occupied: {
      cardBg: 'bg-rose-50/40 hover:bg-rose-50/80',
      border: 'border-rose-300 hover:border-rose-500',
      shadow: 'hover:shadow-rose-100',
      headerBg: 'bg-rose-100/60 text-rose-900 border-b-rose-200',
      accentColor: 'text-rose-700',
      laneColor: 'border-rose-400',
      slotIdBg: 'bg-rose-600 text-white',
    },
    reserved: {
      cardBg: 'bg-amber-50/40 hover:bg-amber-50/80',
      border: 'border-amber-300 hover:border-amber-500',
      shadow: 'hover:shadow-amber-100',
      headerBg: 'bg-amber-100/60 text-amber-900 border-b-amber-200',
      accentColor: 'text-amber-700',
      laneColor: 'border-amber-400',
      slotIdBg: 'bg-amber-600 text-white',
    },
    unknown: {
      cardBg: 'bg-slate-50 hover:bg-slate-100/70',
      border: 'border-slate-300 hover:border-slate-400',
      shadow: 'hover:shadow-slate-100',
      headerBg: 'bg-slate-200/60 text-slate-800 border-b-slate-200',
      accentColor: 'text-slate-600',
      laneColor: 'border-slate-400',
      slotIdBg: 'bg-slate-600 text-white',
    },
  }[slot.status];

  // Calculate duration if occupied
  const getOccupancyDuration = (isoString?: string) => {
    if (!isoString) return 'Just now';
    const diffMins = Math.max(1, Math.floor((Date.now() - new Date(isoString).getTime()) / 60000));
    if (diffMins < 60) return `${diffMins}m ago`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m ago`;
  };

  return (
    <div
      className={`group relative rounded-lg border-2 ${theme.border} ${theme.cardBg} shadow-sm ${theme.shadow} transition-all duration-200 flex flex-col justify-between overflow-hidden`}
    >
      {/* Top Header Bar */}
      <div className={`flex items-center justify-between px-3.5 py-2 border-b ${theme.headerBg}`}>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded font-mono text-xs font-bold tracking-wide ${theme.slotIdBg}`}>
            {slot.slotId}
          </span>
          <span className="text-[11px] font-medium text-slate-600">
            {slot.floorId}
          </span>
        </div>
        <StatusBadge status={slot.status} size="sm" />
      </div>

      {/* Main Bay Area with Garage Visual */}
      <div className="p-3.5 flex-1 flex flex-col justify-between">
        {/* Sensor & Distance Telemetry strip */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-2 pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-1.5" title={`Sensor ID: ${slot.sensorId}`}>
            {slot.sensorOnline ? (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Wifi className="w-3.5 h-3.5" />
                <span>{slot.signalRssi} dBm</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 font-medium">
                <WifiOff className="w-3.5 h-3.5" />
                <span>Offline</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
            <span>Dist:</span>
            <span className="font-semibold text-slate-800">
              {slot.sensorOnline ? `${slot.sensorDistanceCm} cm` : '---'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
            <BatteryCharging className="w-3.5 h-3.5 text-slate-400" />
            <span>{slot.batteryLevel}%</span>
          </div>
        </div>

        {/* Visual Bay State */}
        <div className="py-2.5 px-2">
          {isOccupied ? (
            <div className="bg-white/90 rounded-md border border-rose-200 p-2.5 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded bg-rose-100 text-rose-700">
                    <Car className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-slate-900 tracking-wider">
                      {slot.vehicleId || 'VEHICLE'}
                    </span>
                    <div className="text-[10px] text-slate-500 font-medium">
                      {slot.vehicleType || 'Sedan'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  Occupied
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Parked: {getOccupancyDuration(slot.occupiedSince)}</span>
              </div>
            </div>
          ) : isAvailable ? (
            <div className="bg-white/80 rounded-md border border-dashed border-emerald-300 p-3 text-center">
              <div className="flex justify-center mb-1">
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xs font-semibold text-emerald-800">Bay Ready & Clear</div>
              <div className="text-[11px] text-slate-500">Ceiling clearance {slot.sensorDistanceCm} cm</div>
            </div>
          ) : isReserved ? (
            <div className="bg-white/90 rounded-md border border-amber-200 p-2.5">
              <div className="flex items-center gap-1.5 text-amber-800 text-xs font-semibold mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Reserved Bay</span>
              </div>
              <div className="text-[11px] text-slate-600 font-mono truncate">
                {slot.reservedFor || slot.vehicleId || 'VIP App Holder'}
              </div>
            </div>
          ) : (
            <div className="bg-white/80 rounded-md border border-slate-300 p-2.5 text-center text-slate-600">
              <div className="text-xs font-medium text-slate-700">Sensor Disconnected</div>
              <div className="text-[11px] text-slate-400">Heartbeat signal missing</div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
          {isAvailable ? (
            <button
              onClick={() => onQuickPark(slot)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <ArrowRightCircle className="w-3.5 h-3.5" />
              <span>Park Car</span>
            </button>
          ) : isOccupied ? (
            <button
              onClick={() => onVacate(slot.slotId)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Vacate Bay</span>
            </button>
          ) : isReserved ? (
            <button
              onClick={() => onQuickPark(slot)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Car className="w-3.5 h-3.5" />
              <span>Check-in</span>
            </button>
          ) : (
            <button
              onClick={() => onSelect(slot)}
              className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-md bg-slate-700 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Inspect</span>
            </button>
          )}

          <button
            onClick={() => onSelect(slot)}
            title="Inspect Slot Details"
            className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
