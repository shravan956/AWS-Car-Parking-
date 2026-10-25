import React, { useState } from 'react';
import { ParkingSlot, VehicleType } from '../../types/parking';
import { useParking } from '../../context/ParkingContext';
import { getRandomPlate } from '../../services/sampleData';
import { X, Car, Sparkles, CheckCircle2 } from 'lucide-react';

interface ParkCarModalProps {
  slot: ParkingSlot | null;
  onClose: () => void;
}

export const ParkCarModal: React.FC<ParkCarModalProps> = ({ slot, onClose }) => {
  const { parkVehicle } = useParking();
  const [plate, setPlate] = useState(() => getRandomPlate());
  const [vehicleType, setVehicleType] = useState<VehicleType>('Sedan');

  if (!slot) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    parkVehicle(slot.slotId, plate.trim() || undefined, vehicleType);
    onClose();
  };

  const handleRandomizePlate = () => {
    setPlate(getRandomPlate());
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Park Vehicle in {slot.slotId}</h3>
              <p className="text-xs text-slate-500">{slot.floorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">Vehicle License Plate</label>
              <button
                type="button"
                onClick={handleRandomizePlate}
                className="text-[11px] font-medium text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Randomize Plate</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="e.g. MH 12 AB 4589"
              className="w-full px-3 py-2 text-sm font-mono uppercase rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Vehicle Category
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Sedan', 'SUV', 'EV', 'Hatchback'] as VehicleType[]).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setVehicleType(type)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold text-center transition-all ${
                    vehicleType === type
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Bay:</span>
              <span className="font-mono font-bold text-slate-800">{slot.slotId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AWS IoT Sensor:</span>
              <span className="font-mono text-slate-800">{slot.sensorId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">New State:</span>
              <span className="font-semibold text-rose-600">OCCUPIED (Red)</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Park</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
