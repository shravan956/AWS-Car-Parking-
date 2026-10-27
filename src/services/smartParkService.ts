import {
  ParkingSlot,
  SystemStats,
  FloorSummary,
  ApiSlotTelemetry,
  ApiParkingResponse,
  ApiHealthResponse,
} from '../types/parking';

export function mapApiSlotToParkingSlot(apiSlot: ApiSlotTelemetry): ParkingSlot {
  return {
    slotId: apiSlot.slotId,
    deviceId: apiSlot.deviceId,
    floor: apiSlot.floor,
    floorId: apiSlot.floorId,
    floorName: apiSlot.floorName,
    status: apiSlot.status,
    occupancy: apiSlot.occupancy,
    occupancyConsistent: apiSlot.occupancyConsistent,
    lastUpdated: apiSlot.timestamp,
    eventId: apiSlot.eventId,
  };
}

export function calculateSystemStats(slots: ParkingSlot[], apiSummary?: ApiParkingResponse['summary'], queryTimestamp?: string): SystemStats {
  const totalSlots = slots.length;
  let availableSlots = 0;
  let occupiedSlots = 0;
  let reservedSlots = 0;
  let unknownSlots = 0;

  const floorMap: Record<string, { name: string; available: number; occupied: number; reserved: number; unknown: number; total: number }> = {
    F1: { name: 'Floor 1 (Ground)', available: 0, occupied: 0, reserved: 0, unknown: 0, total: 0 },
    F2: { name: 'Floor 2 (Mid-Level)', available: 0, occupied: 0, reserved: 0, unknown: 0, total: 0 },
    F3: { name: 'Floor 3 (Rooftop / EV)', available: 0, occupied: 0, reserved: 0, unknown: 0, total: 0 },
  };

  slots.forEach((s) => {
    const fId = s.floorId || 'UNKNOWN';
    if (!floorMap[fId]) {
      floorMap[fId] = { name: s.floorName || `Floor ${fId}`, available: 0, occupied: 0, reserved: 0, unknown: 0, total: 0 };
    }
    floorMap[fId].total += 1;
    switch (s.status) {
      case 'available':
        availableSlots += 1;
        floorMap[fId].available += 1;
        break;
      case 'occupied':
        occupiedSlots += 1;
        floorMap[fId].occupied += 1;
        break;
      case 'reserved':
        reservedSlots += 1;
        floorMap[fId].reserved += 1;
        break;
      default:
        unknownSlots += 1;
        floorMap[fId].unknown += 1;
        break;
    }
  });

  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  // Use floors from API summary if available, otherwise from floorMap
  const floors: FloorSummary[] = apiSummary?.floors?.length
    ? apiSummary.floors.map((f) => ({
        floorId: f.floorId,
        name: f.name,
        totalSlots: f.totalSlots,
        available: f.available,
        occupied: f.occupied,
        reserved: f.reserved,
        unknown: f.unknown,
        occupancyRate: f.occupancyRate,
      }))
    : Object.keys(floorMap).map((fId) => {
        const f = floorMap[fId];
        const floorRate = f.total > 0 ? Math.round((f.occupied / f.total) * 100) : 0;
        return {
          floorId: fId,
          name: f.name,
          totalSlots: f.total,
          available: f.available,
          occupied: f.occupied,
          reserved: f.reserved,
          unknown: f.unknown,
          occupancyRate: floorRate,
        };
      });

  return {
    totalSlots: apiSummary?.totalSlots ?? totalSlots,
    availableSlots: apiSummary?.availableSlots ?? availableSlots,
    occupiedSlots: apiSummary?.occupiedSlots ?? occupiedSlots,
    reservedSlots: apiSummary?.reservedSlots ?? reservedSlots,
    unknownSlots: apiSummary?.unknownSlots ?? unknownSlots,
    occupancyRate: apiSummary?.occupancyRate ?? occupancyRate,
    floors,
    lastUpdate: queryTimestamp || null,
  };
}

export async function fetchAwsParkingData(apiBaseUrl: string): Promise<{
  slots: ParkingSlot[];
  stats: SystemStats;
  queryTimestamp: string;
}> {
  const cleanUrl = apiBaseUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl) {
    throw new Error('AWS API Base URL is not configured.');
  }

  const res = await fetch(`${cleanUrl}/api/v1/parking`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`AWS Parking API request failed: HTTP ${res.status} (${res.statusText || 'Error'})`);
  }

  const data: ApiParkingResponse = await res.json();
  const slots = (data.slots || []).map(mapApiSlotToParkingSlot);
  const stats = calculateSystemStats(slots, data.summary, data.queryTimestamp);

  return {
    slots,
    stats,
    queryTimestamp: data.queryTimestamp,
  };
}

export async function checkAwsApiHealth(apiBaseUrl: string): Promise<ApiHealthResponse> {
  const cleanUrl = apiBaseUrl.trim().replace(/\/+$/, '');
  if (!cleanUrl) {
    throw new Error('AWS API Base URL is not configured.');
  }

  const res = await fetch(`${cleanUrl}/api/v1/health`, {
    headers: { Accept: 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Health check returned HTTP ${res.status}`);
  }
  return await res.json();
}
