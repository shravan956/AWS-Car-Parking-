import React, { useState } from 'react';
import { ParkingSlot, VehicleType } from '../../types/parking';
import { useParking } from '../../context/ParkingContext';
import { StatusBadge } from '../common/StatusBadge';
import {
  X,
  Car,
  Wifi,
  WifiOff,
  Battery,
  Radio,
  Layers,
  Clock,
  ArrowRightCircle,
  LogOut,
  CalendarCheck,
  AlertTriangle,
  History,
  Hash,
} from 'lucide-react';

interface SlotDetailDrawerProps {
  slot: ParkingSlot | null;
  onClose: () => void;
}

export const SlotDetailDrawer: React.FC<SlotDetailDrawerProps> = ({ slot, onClose }) => {
  const { parkVehicle, vacateSlot, reserveSlot, toggleSensor, events } = useParking();
  const [customPlate, setCustomPlate] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('Sedan');
  const [reservedNote, setReservedNote] = useState('');

  if (!slot) return null;

  const slotEvents = events.filter((e) => e.slotId === slot.slotId).slice(0, 8);

  const handlePark = (e: React.FormEvent) => {
    e.preventDefault();
    parkVehicle(slot.slotId, customPlate.trim() || undefined, vehicleType);
    setCustomPlate('');
  };

  const handleReserve = () => {
    reserveSlot(slot.slotId, reservedNote.trim() || undefined);
    setReservedNote('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-brand-600 text-white flex items-center justify-center font-bold text-sm">
              {slot.slotId}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{slot.floorName}</h2>
              <div className="text-xs text-slate-500 font-mono">Bay ID: {slot.slotId}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={slot.status} size="md" />
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Current Vehicle / Status */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Car className="w-4 h-4 text-brand-600" />
              <span>Parking Bay Status</span>
            </h3>

            {slot.status === 'occupied' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-white p-3 rounded-md border border-rose-200">
                  <div>
                    <span className="text-xs text-slate-500">License Plate</span>
                    <div className="font-mono text-base font-bold text-slate-900">
                      {slot.vehicleId || 'UNIDENTIFIED'}
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-rose-100 text-rose-800 font-semibold text-xs border border-rose-200">
                    {slot.vehicleType || 'Sedan'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1">
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">PARKED SINCE</span>
                    <span className="font-medium text-slate-800">
                      {slot.occupiedSince ? new Date(slot.occupiedSince).toLocaleTimeString() : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-200">
                    <span className="text-slate-400 block text-[10px]">SYSTEM STATE</span>
                    <span className="font-semibold text-rose-600 uppercase">OCCUPIED</span>
                  </div>
                </div>
              </div>
            ) : slot.status === 'available' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-3 text-center">
                <div className="text-emerald-800 font-semibold text-sm">Slot is Open & Available</div>
                <p className="text-xs text-emerald-600 mt-0.5">
                  Clear ultrasonic reading: {slot.sensorDistanceCm} cm
                </p>
              </div>
            ) : slot.status === 'reserved' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="text-amber-800 font-semibold text-sm">Reserved Slot</div>
                <p className="text-xs text-amber-700 mt-1">
                  Hold reason: {slot.reservedFor || 'Corporate / VIP Access'}
                </p>
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-300 rounded-md p-3 text-center">
                <div className="text-slate-800 font-semibold text-sm">Hardware Link Offline</div>
                <p className="text-xs text-slate-500 mt-1">
                  Sensor heartbeat packet missed from AWS IoT Core.
                </p>
              </div>
            )}
          </div>

          {/* Section 2: IoT Sensor Telemetry */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-brand-600" />
              <span>AWS IoT Sensor Telemetry</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white p-2.5 rounded-md border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span>SENSOR ID</span>
                  <Hash className="w-3 h-3 text-slate-400" />
                </div>
                <div className="font-mono font-semibold text-slate-800">{slot.sensorId}</div>
              </div>

              <div className="bg-white p-2.5 rounded-md border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span>DISTANCE READING</span>
                  <Layers className="w-3 h-3 text-slate-400" />
                </div>
                <div className="font-semibold text-slate-800">
                  {slot.sensorOnline ? `${slot.sensorDistanceCm} cm` : 'Disconnected'}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-md border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span>SIGNAL (RSSI)</span>
                  {slot.sensorOnline ? (
                    <Wifi className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <WifiOff className="w-3 h-3 text-rose-500" />
                  )}
                </div>
                <div className="font-semibold text-slate-800">
                  {slot.sensorOnline ? `${slot.signalRssi} dBm` : '0 dBm'}
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-md border border-slate-200">
                <div className="flex items-center justify-between text-slate-400 text-[10px] mb-1">
                  <span>BATTERY LEVEL</span>
                  <Battery className="w-3 h-3 text-slate-400" />
                </div>
                <div className="font-semibold text-slate-800">{slot.batteryLevel}%</div>
              </div>
            </div>

            <div className="mt-3 bg-white p-2.5 rounded-md border border-slate-200">
              <div className="text-[10px] text-slate-400 uppercase font-mono">AWS MQTT Topic</div>
              <div className="font-mono text-xs text-brand-700 truncate mt-0.5">
                smartpark/slots/{slot.slotId.toLowerCase()}/telemetry
              </div>
            </div>
          </div>

          {/* Section 3: Interactive Controls (Manual Override / Real-time Demo Actions) */}
          <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <ArrowRightCircle className="w-4 h-4 text-brand-600" />
              <span>Interactive Controls</span>
            </h3>

            {/* Quick Actions depending on state */}
            {slot.status === 'occupied' ? (
              <div className="space-y-2">
                <button
                  onClick={() => vacateSlot(slot.slotId)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Vacate Bay (Set to Available - Green)</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handlePark} className="space-y-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Park Vehicle (License Plate)
                  </label>
                  <input
                    type="text"
                    value={customPlate}
                    onChange={(e) => setCustomPlate(e.target.value)}
                    placeholder="e.g. MH 12 AB 4589 (leave blank for random)"
                    className="w-full text-xs font-mono uppercase px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-500 mb-1">
                      Vehicle Type
                    </label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as VehicleType)}
                      className="w-full text-xs px-2 py-1.5 rounded-md border border-slate-300 bg-white"
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="EV">EV (Electric)</option>
                      <option value="Hatchback">Hatchback</option>
                    </select>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors"
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>Park Car</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Additional Secondary Controls */}
            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <button
                onClick={handleReserve}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors ${
                  slot.status === 'reserved'
                    ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>{slot.status === 'reserved' ? 'Clear Hold' : 'Reserve Slot'}</span>
              </button>

              <button
                onClick={() => toggleSensor(slot.slotId)}
                className={`px-3 py-1.5 rounded-md border text-xs font-medium inline-flex items-center justify-center gap-1 transition-colors ${
                  !slot.sensorOnline
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{slot.sensorOnline ? 'Simulate Fault' : 'Restore Sensor'}</span>
              </button>
            </div>
          </div>

          {/* Section 4: Slot Event History */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-brand-600" />
              <span>Activity History ({slotEvents.length})</span>
            </h3>

            {slotEvents.length === 0 ? (
              <div className="text-xs text-slate-400 py-3 text-center bg-slate-50 rounded border border-slate-200">
                No recent activity logged for this bay.
              </div>
            ) : (
              <div className="space-y-2">
                {slotEvents.map((evt) => (
                  <div
                    key={evt.eventId}
                    className="p-2.5 rounded-md border border-slate-200 bg-slate-50/60 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-brand-600 font-semibold">
                        {evt.eventType.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-700 font-medium">{evt.notes || 'Status changed'}</div>
                    {evt.vehicleId && (
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Plate: {evt.vehicleId}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last sync: {new Date(slot.lastUpdated).toLocaleTimeString()}</span>
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 font-medium text-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
