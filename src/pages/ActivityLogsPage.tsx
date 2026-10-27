import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { FloorId, ActivityEvent } from '../types/parking';
import { exportEventsToCSV } from '../services/csvExport';
import {
  FileText,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  Layers,
} from 'lucide-react';

export const ActivityLogsPage: React.FC = () => {
  const { events, setSelectedSlot, slots } = useParking();

  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState<FloorId | 'ALL'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (floorFilter !== 'ALL' && evt.floorId !== floorFilter) return false;

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchSlot = evt.slotId ? evt.slotId.toLowerCase().includes(q) : false;
        const matchSource = evt.source ? evt.source.toLowerCase().includes(q) : false;
        const matchNotes = evt.notes ? evt.notes.toLowerCase().includes(q) : false;
        if (!matchSlot && !matchSource && !matchNotes) return false;
      }

      return true;
    });
  }, [events, floorFilter, search]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage));
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportCSV = () => {
    exportEventsToCSV(filteredEvents, `smartpark-activity-logs-${Date.now()}.csv`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Live Session Activity
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Parking Activity & State Change Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Log of genuine slot status transitions observed during active monitoring.
          </p>
        </div>

        {filteredEvents.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV ({filteredEvents.length} Rows)</span>
            </button>
          </div>
        )}
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-100 p-1 rounded-lg">
            {(['ALL', 'F1', 'F2', 'F3'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  setFloorFilter(f);
                  setCurrentPage(1);
                }}
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
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by bay ID (e.g. F1-S05)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Events Table or Empty State */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        {filteredEvents.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            <Activity className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
            <h3 className="font-bold text-slate-800 text-sm">No State Transitions Recorded</h3>
            <p className="text-slate-400 mt-1 max-w-md mx-auto">
              No parking slots have changed state during the current browser session. Real-time transitions will automatically be captured here as they occur.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Parking Slot</th>
                    <th className="py-3 px-4">Floor</th>
                    <th className="py-3 px-4">State Transition</th>
                    <th className="py-3 px-4">Source</th>
                    <th className="py-3 px-4">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedEvents.map((evt: ActivityEvent) => (
                    <tr key={evt.eventId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => {
                            const slot = slots.find((s) => s.slotId === evt.slotId);
                            if (slot) setSelectedSlot(slot);
                          }}
                          className="font-mono font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          {evt.slotId || 'Unassigned'}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {evt.floorId || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] capitalize text-slate-500 font-medium">
                            {evt.previousStatus}
                          </span>
                          <span className="text-slate-300">&rarr;</span>
                          <StatusBadge status={evt.newStatus} size="sm" showIcon={false} />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {evt.source || 'AWS DynamoDB'}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {evt.notes || '---'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of{' '}
                  {filteredEvents.length} events
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-mono text-[11px]">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
