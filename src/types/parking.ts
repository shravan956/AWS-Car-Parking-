export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'unknown';
export type FloorId = 'F1' | 'F2' | 'F3';

// ==============================================================================
// Verified Backend API Contracts (/api/v1/health, /api/v1/parking)
// ==============================================================================

export interface ApiSlotTelemetry {
  slotId: string | null;
  deviceId: string;
  floor: number | null;
  floorId: string | null;
  floorName: string;
  status: SlotStatus;
  occupancy: number | null;
  occupancyConsistent: boolean | null;
  sensorOnline?: boolean;
  timestamp: string | null;
  freshness?: string;
  eventId: string | null;
}

export interface ApiFloorSummary {
  floorId: string;
  name: string;
  totalSlots: number;
  available: number;
  occupied: number;
  reserved: number;
  unknown: number;
  occupancyRate: number;
}

export interface ApiParkingSummary {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  unknownSlots: number;
  occupancyRate: number;
  floors: ApiFloorSummary[];
}

export interface ApiParkingResponse {
  total: number;
  queryTimestamp: string;
  slots: ApiSlotTelemetry[];
  summary: ApiParkingSummary;
}

export interface ApiHealthResponse {
  status: 'healthy' | 'unhealthy';
  region: string;
  table: string;
  tableStatus?: string;
  queryTimestamp: string;
  dynamodbConnected: boolean;
  error?: string;
}

// ==============================================================================
// Frontend UI Models (Clean & View-Only)
// ==============================================================================

export interface ParkingSlot {
  slotId: string | null;
  deviceId: string;
  floor: number | null;
  floorId: string | null;
  floorName: string;
  status: SlotStatus;
  occupancy?: number | null;
  occupancyConsistent?: boolean | null;
  lastUpdated: string | null;
  eventId?: string | null;
}

export interface ActivityEvent {
  eventId: string;
  timestamp: string;
  slotId: string | null;
  floorId: string | null;
  previousStatus: SlotStatus;
  newStatus: SlotStatus;
  source?: string;
  notes?: string;
}

export interface FloorSummary {
  floorId: string;
  name: string;
  totalSlots: number;
  available: number;
  occupied: number;
  reserved: number;
  unknown: number;
  occupancyRate: number;
}

export interface SystemStats {
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  unknownSlots: number;
  occupancyRate: number;
  floors: FloorSummary[];
  lastUpdate: string | null;
}

export interface AWSConfig {
  region: string;
  apiBaseUrl: string;
  apiStatus: 'Not Configured' | 'Checking' | 'Healthy' | 'Unhealthy';
  lastApiError: string | null;
  dynamoDbTable: string;
  refreshIntervalSeconds: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  slotId?: string | null;
}
