import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useParking } from '../context/ParkingContext';
import { StatCard } from '../components/common/StatCard';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  Car,
  CheckCircle2,
  Layers,
  Percent,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  Activity,
  Cloud,
  Clock,
} from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    stats,
    events,
    slots,
    setSelectedSlot,
    lastApiTimestamp,
    lastRefreshed,
    awsConfig,
    refreshNow,
    isLoading,
    isInitialLoading,
    apiError,
  } = useParking();

  const formattedTimestamp = lastApiTimestamp
    ? new Date(lastApiTimestamp).toLocaleString()
    : lastRefreshed
    ? lastRefreshed.toLocaleString()
    : null;

  // Initial loading state
  if (isInitialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-800">Connecting to AWS API Gateway</h3>
          <p className="text-xs text-slate-500 mt-1">Retrieving live parking state from DynamoDB table...</p>
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
                Could not fetch current parking status from the API. Displaying last known state or awaiting connection.
              </p>
              <p className="font-mono text-[10px] bg-rose-100 text-rose-900 p-1 rounded mt-1.5 inline-block">
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

      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                awsConfig.apiStatus === 'Healthy' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5 text-blue-500" />
              <span>AWS {awsConfig.region} &bull; {awsConfig.dynamoDbTable}</span>
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Parking Monitoring Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-level occupancy monitoring across 3 parking floors.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          {formattedTimestamp && (
            <div className="flex items-center gap-1.5 text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 font-mono text-[11px]">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>API Last Updated: {formattedTimestamp}</span>
            </div>
          )}

          <button
            onClick={refreshNow}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 1. Four Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Slots"
          value={stats.totalSlots}
          subtitle="3 multi-level floors"
          icon={Layers}
          variant="slate"
          onClick={() => navigate('/live-parking')}
        />
        <StatCard
          title="Available"
          value={stats.availableSlots}
          subtitle={`${stats.totalSlots > 0 ? Math.round((stats.availableSlots / stats.totalSlots) * 100) : 0}% capacity free`}
          icon={CheckCircle2}
          variant="green"
          onClick={() => navigate('/live-parking')}
        />
        <StatCard
          title="Occupied"
          value={stats.occupiedSlots}
          subtitle={`${stats.occupancyRate}% bays in use`}
          icon={Car}
          variant="red"
          onClick={() => navigate('/live-parking')}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats.occupancyRate}%`}
          subtitle="Facility load factor"
          icon={Percent}
          variant="blue"
          onClick={() => navigate('/live-parking')}
        />
      </div>

      {/* 2. Three-Floor Parking Overview */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Floor-by-Floor Parking Status</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current slot distribution across Floor 1, Floor 2, and Floor 3.
            </p>
          </div>
          <button
            onClick={() => navigate('/live-parking')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
          >
            <span>Live Grid View</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.floors.map((floor) => {
            const floorSlots = slots.filter((s) => s.floorId === floor.floorId);
            const occRate = floor.totalSlots > 0 ? floor.occupancyRate : 0;
            return (
              <div
                key={floor.floorId}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-slate-900">{floor.name}</span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        occRate >= 75
                          ? 'bg-rose-100 text-rose-800'
                          : occRate >= 40
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {occRate}% Full
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden flex mb-3">
                    <div
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${occRate}%` }}
                      title={`Occupied: ${floor.occupied}`}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${100 - occRate}%` }}
                      title={`Available: ${floor.available}`}
                    />
                  </div>

                  {/* Slot Counts */}
                  <div className="grid grid-cols-3 gap-2 text-center text-xs mb-3">
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Available</span>
                      <span className="font-bold text-emerald-700 text-sm">{floor.available}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Occupied</span>
                      <span className="font-bold text-rose-700 text-sm">{floor.occupied}</span>
                    </div>
                    <div className="bg-white p-2 rounded-lg border border-slate-200">
                      <span className="text-[10px] text-slate-400 block uppercase font-medium">Total</span>
                      <span className="font-bold text-slate-700 text-sm">{floor.totalSlots}</span>
                    </div>
                  </div>

                  {/* Mini Slot Dot Matrix */}
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Bay Status
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {floorSlots.map((s, idx) => {
                        const isOcc = s.status === 'occupied';
                        return (
                          <button
                            key={s.slotId || idx}
                            onClick={() => setSelectedSlot(s)}
                            title={`${s.slotId}: ${s.status.toUpperCase()}`}
                            className={`px-1 py-1 rounded text-[10px] font-mono font-bold text-center cursor-pointer transition-all ${
                              isOcc
                                ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                            }`}
                          >
                            {s.slotId ? s.slotId.replace(/F\d+-/, '') : `S${idx + 1}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Concise Recent Activity Section (Genuine Session Events Only) */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle">
        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Recent State Transitions</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Genuine parking slot status changes observed during the active session.
            </p>
          </div>
          {events.length > 0 && (
            <button
              onClick={() => navigate('/activity-logs')}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All Logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {events.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
            <Activity className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-60" />
            <p className="font-semibold text-slate-700">No slot state changes observed in current session.</p>
            <p className="text-slate-400 mt-0.5 text-[11px]">
              When vehicles enter or depart parking slots, status changes will appear here automatically.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-y border-slate-200 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Floor</th>
                  <th className="py-2.5 px-3">Transition</th>
                  <th className="py-2.5 px-3">Source</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.slice(0, 5).map((evt) => (
                  <tr key={evt.eventId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                      {new Date(evt.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {evt.slotId || 'Unassigned'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {evt.floorId || 'N/A'}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] capitalize text-slate-500">{evt.previousStatus}</span>
                        <span className="text-slate-300">&rarr;</span>
                        <StatusBadge status={evt.newStatus} size="sm" showIcon={false} />
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                      {evt.source || 'AWS DynamoDB'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
