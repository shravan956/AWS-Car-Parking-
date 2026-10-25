import { ActivityEvent } from '../types/parking';

export function exportEventsToCSV(events: ActivityEvent[], filename = 'smartpark-activity-logs.csv'): void {
  const headers = [
    'Event ID',
    'Timestamp (ISO)',
    'Slot ID',
    'Floor',
    'Event Type',
    'Previous Status',
    'New Status',
    'Vehicle Plate',
    'Vehicle Type',
    'Event Source',
    'Notes',
    'Simulated',
  ];

  const rows = events.map((e) => [
    e.eventId,
    e.timestamp,
    e.slotId,
    e.floorId,
    e.eventType,
    e.previousStatus,
    e.newStatus,
    e.vehicleId ? `"${e.vehicleId}"` : 'N/A',
    e.vehicleType || 'N/A',
    `"${e.source.replace(/"/g, '""')}"`,
    e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '',
    e.isSimulated ? 'Yes' : 'No',
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
