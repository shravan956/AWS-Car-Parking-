import React, { useState, useMemo } from 'react';
import { useParking } from '../context/ParkingContext';
import { StatusBadge } from '../components/common/StatusBadge';
import { FloorId, EventType, ActivityEvent } from '../types/parking';
import { exportEventsToCSV } from '../services/csvExport';
import {
  FileText,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Car,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

export const ActivityLogsPage: React.FC = () => {
  const { events, slots, setSelectedSlot } = useParking();

  const [search, setSearch] = useState('');
  const [floorFilter, setFloorFilter] = useState<FloorId | 'ALL'>('ALL');
  const [typeFilter, setTypeFilter] = useState<EventType | 'ALL'>('ALL');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter and sort events
  const filteredEvents = useMemo(() => {
    return events
      .filter((evt) => {
        if (floorFilter !== 'ALL' && evt.floorId !== floorFilter) return false;
        if (typeFilter !== 'ALL' && evt.eventType !== typeFilter) return false;

        if (search.trim()) {
          const q = search.toLowerCase().trim();
          const matchSlot = evt.slotId.toLowerCase().includes(q);
          const matchPlate = evt.vehicleId?.toLowerCase().includes(q);
          const matchEventId = evt.eventId.toLowerCase().includes(q);
          const matchSource = evt.source.toLowerCase().includes(q);
          if (!matchSlot && !matchPlate && !matchEventId && !matchSource) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [events, floorFilter, typeFilter, search, sortOrder]);

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
            <FileText className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
              Audit & Activity Stream
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Parking Activity & Telemetry Logs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log of all vehicle entries, exits, reservations, and AWS IoT sensor state changes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV ({filteredEvents.length} Rows)</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Floor filter */}
          <select
            value={floorFilter}
            onChange={(e) => {
              setFloorFilter(e.target.value as FloorId | 'ALL');
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Floors</option>
            <option value="F1">Floor 1</option>
            <option value="F2">Floor 2</option>
            <option value="F3">Floor 3</option>
          </select>

          {/* Event type filter */}
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value as EventType | 'ALL');
              setCurrentPage(1);
            }}
            className="text-xs px-3 py-1.5 rounded-md border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="VEHICLE_ENTRY">Vehicle Entry</option>
            <option value="VEHICLE_EXIT">Vehicle Exit</option>
            <option value="RESERVATION_PLACED">Reservation Placed</option>
            <option value="RESERVATION_CANCELLED">Reservation Cancelled</option>
            <option value="SENSOR_ONLINE">Sensor Online</option>
            <option value="SENSOR_OFFLINE">Sensor Offline</option>
          </select>

          {/* Sort toggle */}
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-medium"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search slot, plate, event ID..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
        </div>
      </div>

      {/* Events Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Slot</th>
                <th className="py-3 px-4">Floor</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Vehicle Plate</th>
                <th className="py-3 px-4">State Transition</th>
                <th className="py-3 px-4">Event Source</th>
                <th className="py-3 px-4">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-slate-400">
                    No activity logs match the selected filters.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((evt) => (
                  <tr key={evt.eventId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{evt.eventId}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => {
                          const slot = slots.find((s) => s.slotId === evt.slotId);
                          if (slot) setSelectedSlot(slot);
                        }}
                        className="font-mono font-bold text-brand-600 hover:underline"
                      >
                        {evt.slotId}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{evt.floorId}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-900">
                        {evt.eventType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                      {evt.vehicleId || '---'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] capitalize text-slate-500">
                          {evt.previousStatus}
                        </span>
                        <span className="text-slate-300 font-bold">→</span>
                        <StatusBadge status={evt.newStatus} size="sm" showIcon={false} />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px] max-w-xs truncate" title={evt.source}>
                      {evt.source}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Demo
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing{' '}
            <span className="font-bold text-slate-900">
              {filteredEvents.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-900">
              {Math.min(currentPage * itemsPerPage, filteredEvents.length)}
            </span>{' '}
            of <span className="font-bold text-slate-900">{filteredEvents.length}</span> events
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
