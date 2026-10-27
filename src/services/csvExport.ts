import { ActivityEvent } from '../types/parking';

export function exportEventsToCSV(events: ActivityEvent[], filename = 'smartpark-activity-logs.csv'): void {
  const headers = [
    'Event ID',
    'Timestamp (ISO)',
    'Slot ID',
    'Floor',
    'Previous Status',
    'New Status',
    'Source',
    'Notes',
  ];

  const rows = events.map((e) => [
    e.eventId,
    e.timestamp,
    e.slotId || 'Unassigned',
    e.floorId || 'N/A',
    e.previousStatus,
    e.newStatus,
    `"${(e.source || 'AWS DynamoDB').replace(/"/g, '""')}"`,
    e.notes ? `"${e.notes.replace(/"/g, '""')}"` : '',
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
