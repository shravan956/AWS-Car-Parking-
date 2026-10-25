import {
  ParkingSlot,
  IoTDevice,
  ActivityEvent,
  SystemStats,
  FloorSummary,
  SlotStatus,
  FloorId,
  VehicleType,
} from '../types/parking';

export interface ISmartParkService {
  getAllSlots(): Promise<ParkingSlot[]>;
  getSlotById(slotId: string): Promise<ParkingSlot | undefined>;
  getRecentEvents(limit?: number): Promise<ActivityEvent[]>;
  getDeviceStatuses(): Promise<IoTDevice[]>;
  getSystemStats(): Promise<SystemStats>;
  updateSlotStatus(
    slotId: string,
    newStatus: SlotStatus,
    vehicleInfo?: { plate?: string; type?: VehicleType },
    source?: string
  ): Promise<{ slot: ParkingSlot; event: ActivityEvent }>;
  toggleSensorStatus(slotId: string): Promise<IoTDevice>;
  subscribeToSlotUpdates(callback: (slots: ParkingSlot[]) => void): () => void;
  subscribeToEvents(callback: (event: ActivityEvent) => void): () => void;
}

/**
 * PRODUCTION ARCHITECTURE SPECIFICATION (AWS-READY):
 *
 * 1. PHYSICAL SENSORS:
 *    - ESP32 / Raspberry Pi Zero with Ultrasonic HC-SR04 or ToF Laser VL53L1X.
 *    - Connects to AWS IoT Core using MQTT over TLS (X.509 certificate authentication).
 *    - Publish Topic: smartpark/slots/{slot_id}/telemetry
 *    - Payload: { slotId, distanceCm, batteryLevel, rssi, timestamp }
 *
 * 2. AWS CLOUD INGESTION:
 *    - AWS IoT Core Rule: SELECT * FROM 'smartpark/slots/+/telemetry'
 *    - Evaluates occupancy threshold (< 50cm = OCCUPIED, > 150cm = AVAILABLE).
 *    - Action: Invokes AWS Lambda function 'ProcessParkingTelemetry'.
 *
 * 3. STATE & STORAGE:
 *    - Amazon DynamoDB: 'SmartPark_Slot_State' table (Partition key: slotId) stores current real-time state.
 *    - Amazon S3: Parquet logs partitioned by year/month/day/hour for audit trail & Athena analytics.
 *
 * 4. REAL-TIME FRONTEND DISTRIBUTION:
 *    - AWS AppSync GraphQL Subscriptions OR AWS API Gateway WebSocket.
 *    - Frontend receives instant pushed updates without polling.
 *    - Authentication: AWS Cognito User Pools (Role-Based Access Control).
 */

export function calculateSystemStats(slots: ParkingSlot[], devices: IoTDevice[]): SystemStats {
  const totalSlots = slots.length;
  let availableSlots = 0;
  let occupiedSlots = 0;
  let reservedSlots = 0;
  let unknownSlots = 0;

  const floorMap: Record<FloorId, { available: number; occupied: number; reserved: number; unknown: number; total: number }> = {
    F1: { available: 0, occupied: 0, reserved: 0, unknown: 0, total: 0 },
    F2: { available: 0, occupied: 0, reserved: 0, unknown: 0, total: 0 },
    F3: { available: 0, occupied: 0, reserved: 0, unknown: 0, total: 0 },
  };

  slots.forEach((s) => {
    floorMap[s.floorId].total += 1;
    switch (s.status) {
      case 'available':
        availableSlots += 1;
        floorMap[s.floorId].available += 1;
        break;
      case 'occupied':
        occupiedSlots += 1;
        floorMap[s.floorId].occupied += 1;
        break;
      case 'reserved':
        reservedSlots += 1;
        floorMap[s.floorId].reserved += 1;
        break;
      case 'unknown':
      default:
        unknownSlots += 1;
        floorMap[s.floorId].unknown += 1;
        break;
    }
  });

  const occupancyRate = totalSlots > 0 ? Math.round((occupiedSlots / totalSlots) * 100) : 0;

  let sensorsOnline = 0;
  let sensorsOffline = 0;
  let sensorsDegraded = 0;

  devices.forEach((d) => {
    if (d.status === 'online') sensorsOnline += 1;
    else if (d.status === 'offline') sensorsOffline += 1;
    else sensorsDegraded += 1;
  });

  const floors: FloorSummary[] = (['F1', 'F2', 'F3'] as FloorId[]).map((fId) => {
    const f = floorMap[fId];
    const floorRate = f.total > 0 ? Math.round((f.occupied / f.total) * 100) : 0;
    const name = fId === 'F1' ? 'Floor 1 (Ground)' : fId === 'F2' ? 'Floor 2 (Mid-Level)' : 'Floor 3 (Rooftop / EV)';
    return {
      floorId: fId,
      name,
      totalSlots: f.total,
      available: f.available,
      occupied: f.occupied,
      reserved: f.reserved,
      unknown: f.unknown,
      occupancyRate: floorRate,
    };
  });

  return {
    totalSlots,
    availableSlots,
    occupiedSlots,
    reservedSlots,
    unknownSlots,
    occupancyRate,
    sensorsOnline,
    sensorsOffline,
    sensorsDegraded,
    floors,
    lastUpdate: new Date().toISOString(),
  };
}
