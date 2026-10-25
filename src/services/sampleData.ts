import { ParkingSlot, IoTDevice, ActivityEvent, FloorId, SlotStatus, VehicleType } from '../types/parking';

export const FLOOR_NAMES: Record<FloorId, string> = {
  F1: 'Floor 1 (Ground)',
  F2: 'Floor 2 (Mid-Level)',
  F3: 'Floor 3 (Rooftop / EV)',
};

const SAMPLE_PLATES = [
  'MH 12 AB 4589',
  'DL 08 CZ 1109',
  'KA 05 MN 2043',
  'TS 09 XY 8320',
  'GJ 01 EQ 7741',
  'HR 26 DQ 5521',
  'TN 07 BL 9024',
  'UP 32 JK 3345',
  'MH 02 CC 6780',
  'KA 03 EF 4412',
  'DL 01 AA 1001',
  'MH 14 TY 9988',
  'RJ 14 QM 7120',
  'WB 02 GH 6631',
];

const VEHICLE_TYPES: VehicleType[] = ['Sedan', 'SUV', 'EV', 'Hatchback'];

export function getRandomPlate(): string {
  return SAMPLE_PLATES[Math.floor(Math.random() * SAMPLE_PLATES.length)];
}

export function getRandomVehicleType(): VehicleType {
  return VEHICLE_TYPES[Math.floor(Math.random() * VEHICLE_TYPES.length)];
}

// Generate the exact 30 slots across 3 floors (10 per floor)
export function createInitialSlots(): ParkingSlot[] {
  const slots: ParkingSlot[] = [];
  const floors: FloorId[] = ['F1', 'F2', 'F3'];

  // Distribution for initial realism:
  // Floor 1: Ground floor, busy (6 occupied, 3 available, 1 reserved)
  // Floor 2: Mid level (4 occupied, 5 available, 1 reserved)
  // Floor 3: Upper deck (3 occupied, 6 available, 1 sensor offline)
  const initialFloorStatuses: Record<FloorId, { status: SlotStatus; sensorOnline: boolean; vehicle?: { plate: string; type: VehicleType; minsAgo: number } }[]> = {
    F1: [
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'MH 12 AB 4589', type: 'SUV', minsAgo: 45 } },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'DL 08 CZ 1109', type: 'Sedan', minsAgo: 110 } },
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'KA 05 MN 2043', type: 'EV', minsAgo: 25 } },
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'TS 09 XY 8320', type: 'Hatchback', minsAgo: 85 } },
      { status: 'reserved', sensorOnline: true, vehicle: { plate: 'GJ 01 EQ 7741', type: 'Sedan', minsAgo: 10 } },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'HR 26 DQ 5521', type: 'SUV', minsAgo: 60 } },
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'TN 07 BL 9024', type: 'Sedan', minsAgo: 140 } },
    ],
    F2: [
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'UP 32 JK 3345', type: 'Sedan', minsAgo: 95 } },
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'MH 02 CC 6780', type: 'SUV', minsAgo: 40 } },
      { status: 'reserved', sensorOnline: true },
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'KA 03 EF 4412', type: 'EV', minsAgo: 15 } },
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'DL 01 AA 1001', type: 'Sedan', minsAgo: 130 } },
      { status: 'available', sensorOnline: true },
    ],
    F3: [
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'MH 14 TY 9988', type: 'EV', minsAgo: 35 } },
      { status: 'available', sensorOnline: true },
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'RJ 14 QM 7120', type: 'Sedan', minsAgo: 70 } },
      { status: 'unknown', sensorOnline: false }, // Simulating an offline sensor
      { status: 'available', sensorOnline: true },
      { status: 'occupied', sensorOnline: true, vehicle: { plate: 'WB 02 GH 6631', type: 'Hatchback', minsAgo: 50 } },
      { status: 'available', sensorOnline: true },
      { status: 'available', sensorOnline: true },
    ]
  };

  const now = Date.now();

  floors.forEach((floorId) => {
    for (let slotNum = 1; slotNum <= 10; slotNum++) {
      const paddedNum = slotNum < 10 ? `0${slotNum}` : `${slotNum}`;
      const slotId = `${floorId}-S${paddedNum}`;
      const sensorId = `SNSR-${floorId}-${paddedNum}`;
      const config = initialFloorStatuses[floorId][slotNum - 1];

      const isOccupied = config.status === 'occupied';
      const isReserved = config.status === 'reserved';
      const isOffline = !config.sensorOnline;

      const distance = isOffline
        ? 0
        : isOccupied
        ? Math.floor(20 + Math.random() * 15) // 20-35cm car clearance
        : Math.floor(240 + Math.random() * 30); // 240-270cm empty ceiling height

      const occupiedSince = config.vehicle
        ? new Date(now - config.vehicle.minsAgo * 60 * 1000).toISOString()
        : undefined;

      const lastUpdated = new Date(now - Math.floor(Math.random() * 120) * 1000).toISOString();

      slots.push({
        slotId,
        floorId,
        floorName: FLOOR_NAMES[floorId],
        status: isOffline ? 'unknown' : config.status,
        sensorId,
        sensorOnline: config.sensorOnline,
        sensorDistanceCm: distance,
        batteryLevel: isOffline ? 12 : Math.floor(82 + Math.random() * 17),
        signalRssi: isOffline ? -98 : Math.floor(-55 - Math.random() * 25),
        lastUpdated,
        vehicleId: config.vehicle?.plate,
        vehicleType: config.vehicle?.type,
        occupiedSince,
        reservedFor: isReserved ? (config.vehicle?.plate || 'Reserved for VIP Member') : undefined,
      });
    }
  });

  return slots;
}

// Generate the 30 IoT devices matching the 30 slots
export function createInitialDevices(slots: ParkingSlot[]): IoTDevice[] {
  return slots.map((slot, index) => {
    const isOffline = !slot.sensorOnline;
    const macHex = (100 + index).toString(16).toUpperCase();
    const sensorType = slot.floorId === 'F3'
      ? 'ToF Laser VL53L1X'
      : slot.floorId === 'F2'
      ? 'Ultrasonic HC-SR04'
      : 'Ultrasonic HC-SR04';

    return {
      deviceId: slot.sensorId,
      slotId: slot.slotId,
      floorId: slot.floorId,
      sensorType,
      status: isOffline ? 'offline' : slot.signalRssi < -78 ? 'degraded' : 'online',
      batteryLevel: slot.batteryLevel,
      rssi: slot.signalRssi,
      distanceCm: slot.sensorDistanceCm,
      reportedState: slot.status,
      firmwareVersion: 'v2.4.1-aws-iot',
      lastSeen: slot.lastUpdated,
      mqttTopic: `smartpark/slots/${slot.slotId.toLowerCase()}/telemetry`,
      macAddress: `4C:11:AE:3D:8F:${macHex}`,
    };
  });
}

// Generate initial activity events for historical realistic log
export function createInitialEvents(slots: ParkingSlot[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  const now = Date.now();

  // Add historical events
  const seedEvents: {
    slotId: string;
    floorId: FloorId;
    type: ActivityEvent['eventType'];
    prev: SlotStatus;
    next: SlotStatus;
    plate?: string;
    vType?: VehicleType;
    minsAgo: number;
    source: string;
    notes: string;
  }[] = [
    {
      slotId: 'F1-S01',
      floorId: 'F1',
      type: 'VEHICLE_ENTRY',
      prev: 'available',
      next: 'occupied',
      plate: 'MH 12 AB 4589',
      vType: 'SUV',
      minsAgo: 45,
      source: 'AWS IoT Core: smartpark/f1/s01/state',
      notes: 'Distance dropped from 254cm to 26cm',
    },
    {
      slotId: 'F1-S02',
      floorId: 'F1',
      type: 'VEHICLE_ENTRY',
      prev: 'available',
      next: 'occupied',
      plate: 'DL 08 CZ 1109',
      vType: 'Sedan',
      minsAgo: 110,
      source: 'AWS IoT Core: smartpark/f1/s02/state',
      notes: 'Ultrasonic sensor triggered occupancy rule',
    },
    {
      slotId: 'F1-S03',
      floorId: 'F1',
      type: 'VEHICLE_EXIT',
      prev: 'occupied',
      next: 'available',
      plate: 'MH 04 ER 8821',
      vType: 'Sedan',
      minsAgo: 15,
      source: 'AWS IoT Core: smartpark/f1/s03/state',
      notes: 'Bay cleared. Distance increased to 258cm',
    },
    {
      slotId: 'F1-S07',
      floorId: 'F1',
      type: 'RESERVATION_PLACED',
      prev: 'available',
      next: 'reserved',
      plate: 'GJ 01 EQ 7741',
      vType: 'Sedan',
      minsAgo: 10,
      source: 'SmartPark Mobile App via AWS API Gateway',
      notes: 'Slot reserved for 60 minutes',
    },
    {
      slotId: 'F2-S04',
      floorId: 'F2',
      type: 'VEHICLE_ENTRY',
      prev: 'available',
      next: 'occupied',
      plate: 'MH 02 CC 6780',
      vType: 'SUV',
      minsAgo: 40,
      source: 'AWS IoT Core: smartpark/f2/s04/state',
      notes: 'Distance reading 29cm',
    },
    {
      slotId: 'F2-S07',
      floorId: 'F2',
      type: 'VEHICLE_ENTRY',
      prev: 'available',
      next: 'occupied',
      plate: 'KA 03 EF 4412',
      vType: 'EV',
      minsAgo: 15,
      source: 'AWS IoT Core: smartpark/f2/s07/state',
      notes: 'EV charging slot occupied',
    },
    {
      slotId: 'F3-S06',
      floorId: 'F3',
      type: 'SENSOR_OFFLINE',
      prev: 'available',
      next: 'unknown',
      minsAgo: 180,
      source: 'AWS IoT Device Defender: Heartbeat Missed',
      notes: 'Keep-alive ping timed out after 3 missed intervals',
    },
    {
      slotId: 'F3-S02',
      floorId: 'F3',
      type: 'VEHICLE_ENTRY',
      prev: 'available',
      next: 'occupied',
      plate: 'MH 14 TY 9988',
      vType: 'EV',
      minsAgo: 35,
      source: 'AWS IoT Core: smartpark/f3/s02/state',
      notes: 'Distance 24cm',
    },
    {
      slotId: 'F2-S01',
      floorId: 'F2',
      type: 'VEHICLE_EXIT',
      prev: 'occupied',
      next: 'available',
      plate: 'DL 05 RT 7712',
      vType: 'Hatchback',
      minsAgo: 8,
      source: 'AWS IoT Core: smartpark/f2/s01/state',
      notes: 'Vehicle departed, bay available',
    },
  ];

  seedEvents.forEach((evt, idx) => {
    events.push({
      eventId: `EVT-${1000 + idx}`,
      timestamp: new Date(now - evt.minsAgo * 60 * 1000).toISOString(),
      slotId: evt.slotId,
      floorId: evt.floorId,
      eventType: evt.type,
      previousStatus: evt.prev,
      newStatus: evt.next,
      vehicleId: evt.plate,
      vehicleType: evt.vType,
      source: evt.source,
      notes: evt.notes,
      isSimulated: true,
    });
  });

  return events;
}
