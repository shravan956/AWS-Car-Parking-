import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  ParkingSlot,
  IoTDevice,
  ActivityEvent,
  SystemStats,
  SlotStatus,
  VehicleType,
  AWSConfig,
  AppNotification,
} from '../types/parking';
import {
  createInitialSlots,
  createInitialDevices,
  createInitialEvents,
  getRandomPlate,
  getRandomVehicleType,
} from '../services/sampleData';
import { calculateSystemStats } from '../services/smartParkService';

interface ParkingContextType {
  slots: ParkingSlot[];
  devices: IoTDevice[];
  events: ActivityEvent[];
  stats: SystemStats;
  selectedSlot: ParkingSlot | null;
  setSelectedSlot: (slot: ParkingSlot | null) => void;
  // Simulation controls
  isSimulating: boolean;
  toggleSimulation: () => void;
  simulationInterval: number; // in seconds
  setSimulationInterval: (seconds: number) => void;
  triggerManualEvent: () => void;
  // Real-time slot operations
  parkVehicle: (slotId: string, vehicleId?: string, vehicleType?: VehicleType) => void;
  vacateSlot: (slotId: string) => void;
  reserveSlot: (slotId: string, reservedFor?: string) => void;
  toggleSensor: (slotId: string) => void;
  resetAllData: () => void;
  // AWS Configuration
  awsConfig: AWSConfig;
  updateAwsConfig: (config: Partial<AWSConfig>) => void;
  // Notifications
  notifications: AppNotification[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  // Global search
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  // Manual refresh timestamp
  lastRefreshed: Date;
  refreshNow: () => void;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

export const ParkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [slots, setSlots] = useState<ParkingSlot[]>(() => createInitialSlots());
  const [devices, setDevices] = useState<IoTDevice[]>(() => createInitialDevices(createInitialSlots()));
  const [events, setEvents] = useState<ActivityEvent[]>(() => createInitialEvents(createInitialSlots()));
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [simulationInterval, setSimulationInterval] = useState<number>(6); // 6s realistic interval
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const [awsConfig, setAwsConfig] = useState<AWSConfig>({
    mode: 'DEMO',
    region: 'us-east-1',
    iotEndpoint: 'a39v7k2l90-ats.iot.us-east-1.amazonaws.com',
    mqttTopicPrefix: 'smartpark/slots',
    dynamoDbTable: 'SmartPark_Slot_State',
    s3LogBucket: 'smartpark-cloud-telemetry-archive',
    refreshIntervalSeconds: 5,
    simulationIntervalSeconds: 6,
    autoSimulate: true,
    iotStatus: 'Not Configured', // Honest cloud status per guidelines
    dynamoStatus: 'Not Configured',
    s3Status: 'Not Configured',
  });

  const [notifications, setNotifications] = useState<AppNotification[]>([
    {
      id: 'notif-1',
      title: 'SmartPark Live Simulation Active',
      message: 'Centralized 30-slot real-time telemetry running across 3 floors.',
      type: 'info',
      timestamp: new Date().toISOString(),
      read: false,
    },
    {
      id: 'notif-2',
      title: 'IoT Telemetry Warning',
      message: 'Sensor SNSR-F3-06 heartbeat missed on Floor 3. State marked unknown.',
      type: 'warning',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      read: false,
      slotId: 'F3-S06',
    },
  ]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]); // Keep last 20
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Update devices when slots change to keep synced
  const syncDevicesWithSlots = useCallback((updatedSlots: ParkingSlot[]) => {
    setDevices((prevDevices) =>
      prevDevices.map((dev) => {
        const matchingSlot = updatedSlots.find((s) => s.slotId === dev.slotId);
        if (!matchingSlot) return dev;
        return {
          ...dev,
          status: !matchingSlot.sensorOnline ? 'offline' : matchingSlot.signalRssi < -80 ? 'degraded' : 'online',
          batteryLevel: matchingSlot.batteryLevel,
          rssi: matchingSlot.signalRssi,
          distanceCm: matchingSlot.sensorDistanceCm,
          reportedState: matchingSlot.status,
          lastSeen: matchingSlot.lastUpdated,
        };
      })
    );
  }, []);

  // Park Vehicle (Occupied: RED)
  const parkVehicle = useCallback(
    (slotId: string, vehicleId?: string, vehicleType?: VehicleType) => {
      const plate = vehicleId || getRandomPlate();
      const vType = vehicleType || getRandomVehicleType();
      const nowIso = new Date().toISOString();
      const distance = Math.floor(22 + Math.random() * 12); // 22-34cm car underside

      setSlots((prevSlots) => {
        const slot = prevSlots.find((s) => s.slotId === slotId);
        if (!slot) return prevSlots;

        const prevStatus = slot.status;
        const updated = prevSlots.map((s) => {
          if (s.slotId !== slotId) return s;
          return {
            ...s,
            status: 'occupied' as SlotStatus,
            sensorDistanceCm: distance,
            lastUpdated: nowIso,
            vehicleId: plate,
            vehicleType: vType,
            occupiedSince: nowIso,
            reservedFor: undefined,
          };
        });

        // Add activity event
        const newEvent: ActivityEvent = {
          eventId: `EVT-${Date.now().toString().slice(-5)}`,
          timestamp: nowIso,
          slotId,
          floorId: slot.floorId,
          eventType: 'VEHICLE_ENTRY',
          previousStatus: prevStatus,
          newStatus: 'occupied',
          vehicleId: plate,
          vehicleType: vType,
          source: `AWS IoT Core: smartpark/${slot.floorId.toLowerCase()}/${slot.slotId.toLowerCase()}/state`,
          notes: `Vehicle parked (${plate}). Sensor distance: ${distance}cm.`,
          isSimulated: awsConfig.mode === 'DEMO',
        };
        setEvents((prev) => [newEvent, ...prev]);

        addNotification({
          title: `Vehicle Parked in ${slotId}`,
          message: `${plate} (${vType}) parked on ${slot.floorName}. Slot marked OCCUPIED.`,
          type: 'info',
          slotId,
        });

        syncDevicesWithSlots(updated);
        setLastRefreshed(new Date());
        return updated;
      });
    },
    [addNotification, syncDevicesWithSlots, awsConfig.mode]
  );

  // Vacate Slot (Available: GREEN)
  const vacateSlot = useCallback(
    (slotId: string) => {
      const nowIso = new Date().toISOString();
      const distance = Math.floor(245 + Math.random() * 25); // 245-270cm empty ceiling height

      setSlots((prevSlots) => {
        const slot = prevSlots.find((s) => s.slotId === slotId);
        if (!slot) return prevSlots;

        const prevStatus = slot.status;
        const departedPlate = slot.vehicleId || 'Vehicle';

        const updated = prevSlots.map((s) => {
          if (s.slotId !== slotId) return s;
          return {
            ...s,
            status: 'available' as SlotStatus,
            sensorDistanceCm: distance,
            lastUpdated: nowIso,
            vehicleId: undefined,
            vehicleType: undefined,
            occupiedSince: undefined,
            reservedFor: undefined,
          };
        });

        // Add activity event
        const newEvent: ActivityEvent = {
          eventId: `EVT-${Date.now().toString().slice(-5)}`,
          timestamp: nowIso,
          slotId,
          floorId: slot.floorId,
          eventType: 'VEHICLE_EXIT',
          previousStatus: prevStatus,
          newStatus: 'available',
          vehicleId: departedPlate,
          vehicleType: slot.vehicleType,
          source: `AWS IoT Core: smartpark/${slot.floorId.toLowerCase()}/${slot.slotId.toLowerCase()}/state`,
          notes: `Vehicle departed (${departedPlate}). Bay cleared to ${distance}cm.`,
          isSimulated: awsConfig.mode === 'DEMO',
        };
        setEvents((prev) => [newEvent, ...prev]);

        addNotification({
          title: `Slot ${slotId} Vacated`,
          message: `${departedPlate} exited ${slot.floorName}. Bay is now AVAILABLE (Green).`,
          type: 'success',
          slotId,
        });

        syncDevicesWithSlots(updated);
        setLastRefreshed(new Date());
        return updated;
      });
    },
    [addNotification, syncDevicesWithSlots, awsConfig.mode]
  );

  // Reserve Slot (Reserved: AMBER)
  const reserveSlot = useCallback(
    (slotId: string, reservedFor = 'Corporate Guest / App Reservation') => {
      const nowIso = new Date().toISOString();

      setSlots((prevSlots) => {
        const slot = prevSlots.find((s) => s.slotId === slotId);
        if (!slot) return prevSlots;

        const prevStatus = slot.status;
        const updated = prevSlots.map((s) => {
          if (s.slotId !== slotId) return s;
          return {
            ...s,
            status: (prevStatus === 'reserved' ? 'available' : 'reserved') as SlotStatus,
            lastUpdated: nowIso,
            reservedFor: prevStatus === 'reserved' ? undefined : reservedFor,
          };
        });

        const isNowReserved = prevStatus !== 'reserved';
        const newEvent: ActivityEvent = {
          eventId: `EVT-${Date.now().toString().slice(-5)}`,
          timestamp: nowIso,
          slotId,
          floorId: slot.floorId,
          eventType: isNowReserved ? 'RESERVATION_PLACED' : 'RESERVATION_CANCELLED',
          previousStatus: prevStatus,
          newStatus: isNowReserved ? 'reserved' : 'available',
          source: 'AWS API Gateway: /reservations',
          notes: isNowReserved ? `Slot reserved for: ${reservedFor}` : 'Reservation cleared',
          isSimulated: awsConfig.mode === 'DEMO',
        };
        setEvents((prev) => [newEvent, ...prev]);

        addNotification({
          title: isNowReserved ? `Slot ${slotId} Reserved` : `Reservation Cleared for ${slotId}`,
          message: isNowReserved
            ? `Slot ${slotId} marked as RESERVED (Amber).`
            : `Slot ${slotId} is now AVAILABLE.`,
          type: 'warning',
          slotId,
        });

        syncDevicesWithSlots(updated);
        setLastRefreshed(new Date());
        return updated;
      });
    },
    [addNotification, syncDevicesWithSlots, awsConfig.mode]
  );

  // Toggle Sensor Online/Offline (Grey)
  const toggleSensor = useCallback(
    (slotId: string) => {
      const nowIso = new Date().toISOString();

      setSlots((prevSlots) => {
        const slot = prevSlots.find((s) => s.slotId === slotId);
        if (!slot) return prevSlots;

        const willBeOnline = !slot.sensorOnline;
        const newStatus: SlotStatus = willBeOnline
          ? slot.vehicleId
            ? 'occupied'
            : 'available'
          : 'unknown';

        const updated = prevSlots.map((s) => {
          if (s.slotId !== slotId) return s;
          return {
            ...s,
            sensorOnline: willBeOnline,
            status: newStatus,
            lastUpdated: nowIso,
            sensorDistanceCm: willBeOnline ? (slot.vehicleId ? 25 : 255) : 0,
            batteryLevel: willBeOnline ? 92 : 8,
            signalRssi: willBeOnline ? -64 : -99,
          };
        });

        const newEvent: ActivityEvent = {
          eventId: `EVT-${Date.now().toString().slice(-5)}`,
          timestamp: nowIso,
          slotId,
          floorId: slot.floorId,
          eventType: willBeOnline ? 'SENSOR_ONLINE' : 'SENSOR_OFFLINE',
          previousStatus: slot.status,
          newStatus,
          source: willBeOnline
            ? 'AWS IoT Core: Connection Acknowledged'
            : 'AWS IoT Device Defender: Heartbeat Missed',
          notes: willBeOnline
            ? 'Sensor telemetry re-established with AWS IoT Broker'
            : 'Sensor unreachable. Offline state triggered.',
          isSimulated: awsConfig.mode === 'DEMO',
        };
        setEvents((prev) => [newEvent, ...prev]);

        addNotification({
          title: `Sensor ${slot.sensorId} ${willBeOnline ? 'Online' : 'Offline'}`,
          message: willBeOnline
            ? `Telemetry link healthy on ${slotId}. Status restored.`
            : `Sensor connectivity lost on ${slotId}. Slot status set to UNKNOWN (Grey).`,
          type: willBeOnline ? 'success' : 'alert',
          slotId,
        });

        syncDevicesWithSlots(updated);
        setLastRefreshed(new Date());
        return updated;
      });
    },
    [addNotification, syncDevicesWithSlots, awsConfig.mode]
  );

  // Simulation tick: Realistic vehicle arrival or departure
  const triggerSimulationTick = useCallback(() => {
    setSlots((currentSlots) => {
      // Find candidate slots
      const onlineSlots = currentSlots.filter((s) => s.sensorOnline);
      const availableSlots = onlineSlots.filter((s) => s.status === 'available');
      const occupiedSlots = onlineSlots.filter((s) => s.status === 'occupied');

      // Decide whether to park or vacate:
      // If occupancy is low (< 35%), favor parking; if high (> 75%), favor vacating
      const currentOccupancyRate = occupiedSlots.length / currentSlots.length;
      const shouldPark =
        occupiedSlots.length === 0 ||
        (availableSlots.length > 0 && (currentOccupancyRate < 0.65 || Math.random() < 0.5));

      if (shouldPark && availableSlots.length > 0) {
        // Pick a random available slot to occupy
        const targetSlot = availableSlots[Math.floor(Math.random() * availableSlots.length)];
        const plate = getRandomPlate();
        const vType = getRandomVehicleType();
        const nowIso = new Date().toISOString();
        const distance = Math.floor(22 + Math.random() * 12);

        const updated = currentSlots.map((s) => {
          if (s.slotId !== targetSlot.slotId) return s;
          return {
            ...s,
            status: 'occupied' as SlotStatus,
            sensorDistanceCm: distance,
            lastUpdated: nowIso,
            vehicleId: plate,
            vehicleType: vType,
            occupiedSince: nowIso,
          };
        });

        const newEvent: ActivityEvent = {
          eventId: `EVT-${Date.now().toString().slice(-5)}`,
          timestamp: nowIso,
          slotId: targetSlot.slotId,
          floorId: targetSlot.floorId,
          eventType: 'VEHICLE_ENTRY',
          previousStatus: 'available',
          newStatus: 'occupied',
          vehicleId: plate,
          vehicleType: vType,
          source: `AWS IoT Core: smartpark/${targetSlot.floorId.toLowerCase()}/${targetSlot.slotId.toLowerCase()}/state`,
          notes: `Live IoT detection: vehicle ${plate} parked. Distance ${distance}cm.`,
          isSimulated: true,
        };

        setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
        syncDevicesWithSlots(updated);
        setLastRefreshed(new Date());
        return updated;
      } else if (occupiedSlots.length > 0) {
        // Pick a random occupied slot to vacate
        const targetSlot = occupiedSlots[Math.floor(Math.random() * occupiedSlots.length)];
        const departedPlate = targetSlot.vehicleId || 'Vehicle';
        const nowIso = new Date().toISOString();
        const distance = Math.floor(245 + Math.random() * 25);

        const updated = currentSlots.map((s) => {
          if (s.slotId !== targetSlot.slotId) return s;
          return {
            ...s,
            status: 'available' as SlotStatus,
            sensorDistanceCm: distance,
            lastUpdated: nowIso,
            vehicleId: undefined,
            vehicleType: undefined,
            occupiedSince: undefined,
          };
        });

        const newEvent: ActivityEvent = {
          eventId: `EVT-${Date.now().toString().slice(-5)}`,
          timestamp: nowIso,
          slotId: targetSlot.slotId,
          floorId: targetSlot.floorId,
          eventType: 'VEHICLE_EXIT',
          previousStatus: 'occupied',
          newStatus: 'available',
          vehicleId: departedPlate,
          vehicleType: targetSlot.vehicleType,
          source: `AWS IoT Core: smartpark/${targetSlot.floorId.toLowerCase()}/${targetSlot.slotId.toLowerCase()}/state`,
          notes: `Live IoT detection: vehicle ${departedPlate} exited. Bay cleared.`,
          isSimulated: true,
        };

        setEvents((prev) => [newEvent, ...prev.slice(0, 99)]);
        syncDevicesWithSlots(updated);
        setLastRefreshed(new Date());
        return updated;
      }

      return currentSlots;
    });
  }, [syncDevicesWithSlots]);

  // Live simulation ticker
  useEffect(() => {
    if (!isSimulating) return;

    const timer = setInterval(() => {
      triggerSimulationTick();
    }, simulationInterval * 1000);

    return () => clearInterval(timer);
  }, [isSimulating, simulationInterval, triggerSimulationTick]);

  const toggleSimulation = useCallback(() => {
    setIsSimulating((prev) => !prev);
  }, []);

  const resetAllData = useCallback(() => {
    const initialSlots = createInitialSlots();
    setSlots(initialSlots);
    setDevices(createInitialDevices(initialSlots));
    setEvents(createInitialEvents(initialSlots));
    setSelectedSlotId(null);
    setLastRefreshed(new Date());
    addNotification({
      title: 'Parking Data Reset',
      message: 'All 30 slots restored to default baseline configurations.',
      type: 'info',
    });
  }, [addNotification]);

  const updateAwsConfig = useCallback((partial: Partial<AWSConfig>) => {
    setAwsConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const refreshNow = useCallback(() => {
    setLastRefreshed(new Date());
  }, []);

  // System statistics derived strictly from slots and devices
  const stats = useMemo(() => {
    return calculateSystemStats(slots, devices);
  }, [slots, devices]);

  const selectedSlot = useMemo(() => {
    if (!selectedSlotId) return null;
    return slots.find((s) => s.slotId === selectedSlotId) || null;
  }, [selectedSlotId, slots]);

  const setSelectedSlot = useCallback((slot: ParkingSlot | null) => {
    setSelectedSlotId(slot ? slot.slotId : null);
  }, []);

  return (
    <ParkingContext.Provider
      value={{
        slots,
        devices,
        events,
        stats,
        selectedSlot,
        setSelectedSlot,
        isSimulating,
        toggleSimulation,
        simulationInterval,
        setSimulationInterval,
        triggerManualEvent: triggerSimulationTick,
        parkVehicle,
        vacateSlot,
        reserveSlot,
        toggleSensor,
        resetAllData,
        awsConfig,
        updateAwsConfig,
        notifications,
        dismissNotification,
        clearAllNotifications,
        searchQuery,
        setSearchQuery,
        lastRefreshed,
        refreshNow,
      }}
    >
      {children}
    </ParkingContext.Provider>
  );
};

export const useParking = (): ParkingContextType => {
  const context = useContext(ParkingContext);
  if (!context) {
    throw new Error('useParking must be used within a ParkingProvider');
  }
  return context;
};
