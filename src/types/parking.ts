export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'unknown';
export type FloorId = 'F1' | 'F2' | 'F3';
export type VehicleType = 'Sedan' | 'SUV' | 'EV' | 'Hatchback';

export interface ParkingSlot {
  slotId: string; // e.g. F1-S01
  floorId: FloorId;
  floorName: string; // e.g. Floor 1 (Ground)
  status: SlotStatus;
  sensorId: string; // e.g. SNSR-F1-01
  sensorOnline: boolean;
  sensorDistanceCm: number; // e.g. 28cm (occupied) or 260cm (empty)
  batteryLevel: number; // 0 - 100%
  signalRssi: number; // dBm e.g. -65
  lastUpdated: string;
  vehicleId?: string; // License Plate e.g. "MH 12 AB 4589"
  vehicleType?: VehicleType;
  occupiedSince?: string;
  reservedFor?: string;
}

export type DeviceStatus = 'online' | 'offline' | 'degraded';

export interface IoTDevice {
  deviceId: string;
  slotId: string;
  floorId: FloorId;
  sensorType: 'Ultrasonic HC-SR04' | 'ToF Laser VL53L1X' | 'IR Optical';
  status: DeviceStatus;
  batteryLevel: number;
  rssi: number;
  distanceCm: number;
  reportedState: SlotStatus;
  firmwareVersion: string;
  lastSeen: string;
  mqttTopic: string;
  macAddress: string;
}

export type EventType =
  | 'VEHICLE_ENTRY'
  | 'VEHICLE_EXIT'
  | 'RESERVATION_PLACED'
  | 'RESERVATION_CANCELLED'
  | 'SENSOR_ONLINE'
  | 'SENSOR_OFFLINE'
  | 'STATUS_OVERRIDE';

export interface ActivityEvent {
  eventId: string;
  timestamp: string;
  slotId: string;
  floorId: FloorId;
  eventType: EventType;
  previousStatus: SlotStatus;
  newStatus: SlotStatus;
  vehicleId?: string;
  vehicleType?: VehicleType;
  source: string; // e.g. "AWS IoT Core: smartpark/f1/s01/state"
  notes?: string;
  isSimulated: boolean;
}

export interface FloorSummary {
  floorId: FloorId;
  name: string;
  totalSlots: number;
  available: number;
  occupied: number;
  reserved: number;
  unknown: number;
  occupancyRate: number;
}

export interface SystemStats {
  totalSlots: number; // exactly 30
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  unknownSlots: number;
  occupancyRate: number;
  sensorsOnline: number;
  sensorsOffline: number;
  sensorsDegraded: number;
  floors: FloorSummary[];
  lastUpdate: string;
}

export interface AWSConfig {
  mode: 'DEMO' | 'SIMULATED_AWS' | 'REAL_AWS';
  region: string;
  iotEndpoint: string;
  mqttTopicPrefix: string;
  dynamoDbTable: string;
  s3LogBucket: string;
  refreshIntervalSeconds: number;
  simulationIntervalSeconds: number;
  autoSimulate: boolean;
  iotStatus: 'Not Configured' | 'Simulated Connected' | 'Connected';
  dynamoStatus: 'Not Configured' | 'Simulated Active' | 'Active';
  s3Status: 'Not Configured' | 'Simulated Active' | 'Active';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  timestamp: string;
  read: boolean;
  slotId?: string;
}
