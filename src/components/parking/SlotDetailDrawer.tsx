import React from 'react';
import { ParkingSlot } from '../../types/parking';
import { useParking } from '../../context/ParkingContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Car,
  CheckCircle2,
  Layers,
  Clock,
  History,
  Hash,
  Database,
  Lock,
} from 'lucide-react';

interface SlotDetailDrawerProps {
  slot: ParkingSlot | null;
  onClose: () => void;
}

export const SlotDetailDrawer: React.FC<SlotDetailDrawerProps> = ({ slot, onClose }) => {
  const { events } = useParking();

  if (!slot) return null;

  const displaySlotId = slot.slotId || 'Unassigned';
  const slotEvents = events.filter((e) => e.slotId === slot.slotId);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              {displaySlotId}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{slot.floorName}</h2>
              <div className="text-xs text-slate-500 font-mono">
                Bay: {displaySlotId} &bull; Device: {slot.deviceId}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={slot.status} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Section 1: Current Parking Status */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-blue-600" />
              <span>Current Status</span>
            </h3>

            {slot.status === 'occupied' ? (
              <div className="bg-white p-3 rounded-lg border border-rose-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-rose-800">Slot is OCCUPIED</div>
                  <p className="text-xs text-slate-500 mt-0.5">Physical occupant detected in bay.</p>
                </div>
              </div>
            ) : slot.status === 'available' ? (
              <div className="bg-white p-3 rounded-lg border border-emerald-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-sm text-emerald-800">Slot is AVAILABLE</div>
                  <p className="text-xs text-slate-500 mt-0.5">Bay is currently vacant and ready for parking.</p>
                </div>
              </div>
            ) : (
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <div className="font-bold text-sm text-slate-800 capitalize">{slot.status}</div>
                <p className="text-xs text-slate-500 mt-0.5">Current state reported by DynamoDB record.</p>
              </div>
            )}
          </div>

          {/* Section 2: Verified DynamoDB Record */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Database className="w-4 h-4 text-blue-600" />
                <span>Verified DynamoDB Record</span>
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                IoTDeviceStatus
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span>PARTITION KEY</span>
                  <Hash className="w-3 h-3 text-slate-400" />
                </div>
                <div className="font-mono font-bold text-slate-900 truncate">
                  {slot.deviceId}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-0.5">
                  <span>SLOT ID</span>
                  <Layers className="w-3 h-3 text-slate-400" />
                </div>
                <div className="font-mono font-bold text-slate-900 truncate">
                  {slot.slotId || 'null'}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-slate-400 text-[10px] mb-0.5">OCCUPANCY VALUE</div>
                <div className="font-mono font-semibold text-slate-800">
                  {slot.occupancy != null ? `Binary: ${slot.occupancy}` : 'N/A'}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <div className="text-slate-400 text-[10px] mb-0.5">CONSISTENCY CHECK</div>
                <div
                  className={`font-semibold ${
                    slot.occupancyConsistent === false ? 'text-rose-600' : 'text-emerald-600'
                  }`}
                >
                  {slot.occupancyConsistent === true
                    ? 'Consistent'
                    : slot.occupancyConsistent === false
                    ? 'Mismatch'
                    : 'Unspecified'}
                </div>
              </div>
            </div>

            <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-mono">Last Record Time</span>
                <span className="font-mono text-slate-700 text-[11px]">
                  {slot.lastUpdated ? new Date(slot.lastUpdated).toLocaleString() : 'null (None)'}
                </span>
              </div>
              {slot.eventId && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-mono">Event UUID</span>
                  <span className="font-mono text-slate-700 text-[10px] truncate max-w-[200px]" title={slot.eventId}>
                    {slot.eventId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Read-Only Architecture Notice */}
          <div className="bg-blue-50 rounded-xl p-3.5 border border-blue-200 text-xs text-blue-900 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-blue-900 block">Read-Only Telemetry Architecture</span>
              <p className="text-blue-800 text-[11px] mt-0.5 leading-relaxed">
                Slot states are updated exclusively by physical IoT sensor events through AWS IoT Core and DynamoDB. Manual overrides are disabled.
              </p>
            </div>
          </div>

          {/* Section 4: Session Activity for this Slot */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600" />
              <span>Session State Changes for this Bay</span>
            </h3>

            {slotEvents.length === 0 ? (
              <div className="text-xs text-slate-400 py-4 text-center">
                No state changes observed for this bay in active session.
              </div>
            ) : (
              <div className="space-y-2">
                {slotEvents.map((evt) => (
                  <div
                    key={evt.eventId}
                    className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs flex items-center justify-between"
                  >
                    <div>
                      <div className="font-semibold text-slate-800">
                        {evt.previousStatus.toUpperCase()} &rarr; {evt.newStatus.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-slate-500">{evt.notes}</div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
