import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  ParkingSlot,
  ActivityEvent,
  SystemStats,
  AWSConfig,
  AppNotification,
} from '../types/parking';
import { fetchAwsParkingData, checkAwsApiHealth, calculateSystemStats } from '../services/smartParkService';

interface ParkingContextType {
  slots: ParkingSlot[];
  stats: SystemStats;
  events: ActivityEvent[];
  selectedSlot: ParkingSlot | null;
  setSelectedSlot: (slot: ParkingSlot | null) => void;
  awsConfig: AWSConfig;
  updateAwsConfig: (config: Partial<AWSConfig>) => void;
  testAwsConnection: () => Promise<boolean>;
  notifications: AppNotification[];
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  lastRefreshed: Date | null;
  lastApiTimestamp: string | null;
  refreshNow: () => void;
  isLoading: boolean;
  isInitialLoading: boolean;
  apiError: string | null;
}

const ParkingContext = createContext<ParkingContextType | undefined>(undefined);

const DEFAULT_API_URL =
  (import.meta.env.VITE_API_BASE_URL as string) ||
  'https://4wjg4caxy6.execute-api.ap-southeast-2.amazonaws.com';

export const ParkingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [slots, setSlots] = useState<ParkingSlot[]>([]);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [lastApiTimestamp, setLastApiTimestamp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [apiError, setApiError] = useState<string | null>(null);

  const [awsConfig, setAwsConfig] = useState<AWSConfig>(() => ({
    region: (import.meta.env.VITE_AWS_REGION as string) || 'ap-southeast-2',
    apiBaseUrl: DEFAULT_API_URL,
    apiStatus: 'Checking',
    lastApiError: null,
    dynamoDbTable: (import.meta.env.VITE_AWS_DYNAMODB_SLOT_TABLE as string) || 'IoTDeviceStatus',
    refreshIntervalSeconds: 10,
  }));

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const addNotification = useCallback((notif: Omit<AppNotification, 'id' | 'timestamp'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    setNotifications((prev) => [newNotif, ...prev.slice(0, 19)]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Track previous slots to detect real transitions during polling
  const previousSlotsRef = useRef<ParkingSlot[]>([]);

  // Fetch real data from AWS API Gateway
  const fetchData = useCallback(async () => {
    if (!awsConfig.apiBaseUrl) {
      setAwsConfig((prev) => ({
        ...prev,
        apiStatus: 'Not Configured',
        lastApiError: 'AWS API Base URL is not configured.',
      }));
      setApiError('AWS API Base URL is not configured.');
      setIsInitialLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await fetchAwsParkingData(awsConfig.apiBaseUrl);

      // Detect genuine state transitions since previous poll
      if (previousSlotsRef.current.length > 0) {
        const prevMap = new Map(previousSlotsRef.current.map((s) => [s.slotId, s]));
        const newEvents: ActivityEvent[] = [];

        data.slots.forEach((newSlot) => {
          if (!newSlot.slotId) return;
          const prev = prevMap.get(newSlot.slotId);
          if (prev && prev.status !== newSlot.status) {
            newEvents.push({
              eventId: newSlot.eventId || `EVT-${Date.now().toString().slice(-6)}`,
              timestamp: newSlot.lastUpdated || data.queryTimestamp,
              slotId: newSlot.slotId,
              floorId: newSlot.floorId,
              previousStatus: prev.status,
              newStatus: newSlot.status,
              source: 'AWS DynamoDB: IoTDeviceStatus',
              notes: `Slot changed from ${prev.status} to ${newSlot.status}.`,
            });

            addNotification({
              title: `Slot ${newSlot.slotId} is now ${newSlot.status.toUpperCase()}`,
              message: `Status updated on ${newSlot.floorName}.`,
              type: newSlot.status === 'occupied' ? 'info' : 'success',
              slotId: newSlot.slotId,
            });
          }
        });

        if (newEvents.length > 0) {
          setEvents((prev) => [...newEvents, ...prev.slice(0, 49)]);
        }
      }

      previousSlotsRef.current = data.slots;
      setSlots(data.slots);
      setLastRefreshed(new Date());
      setLastApiTimestamp(data.queryTimestamp);
      setApiError(null);

      setAwsConfig((prev) => ({
        ...prev,
        apiStatus: 'Healthy',
        lastApiError: null,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to AWS API Gateway';
      setApiError(msg);
      setAwsConfig((prev) => ({
        ...prev,
        apiStatus: 'Unhealthy',
        lastApiError: msg,
      }));
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
    }
  }, [awsConfig.apiBaseUrl, addNotification]);

  // Test AWS connection manually via health check
  const testAwsConnection = useCallback(async (): Promise<boolean> => {
    if (!awsConfig.apiBaseUrl) {
      setAwsConfig((prev) => ({
        ...prev,
        apiStatus: 'Not Configured',
        lastApiError: 'API Base URL is required.',
      }));
      return false;
    }

    setAwsConfig((prev) => ({ ...prev, apiStatus: 'Checking', lastApiError: null }));
    try {
      const health = await checkAwsApiHealth(awsConfig.apiBaseUrl);
      if (health.status === 'healthy') {
        setAwsConfig((prev) => ({
          ...prev,
          apiStatus: 'Healthy',
          lastApiError: null,
        }));
        await fetchData();
        return true;
      } else {
        throw new Error(health.error || 'Health check reported unhealthy status');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Health check failed';
      setAwsConfig((prev) => ({
        ...prev,
        apiStatus: 'Unhealthy',
        lastApiError: msg,
      }));
      return false;
    }
  }, [awsConfig.apiBaseUrl, fetchData]);

  // Initial load and recurring poll
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, Math.max(3, awsConfig.refreshIntervalSeconds) * 1000);

    return () => clearInterval(interval);
  }, [fetchData, awsConfig.refreshIntervalSeconds]);

  const updateAwsConfig = useCallback((partial: Partial<AWSConfig>) => {
    setAwsConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  const refreshNow = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const stats = useMemo(() => {
    return calculateSystemStats(slots, undefined, lastApiTimestamp || undefined);
  }, [slots, lastApiTimestamp]);

  const selectedSlot = useMemo(() => {
    if (!selectedSlotId) return null;
    return slots.find((s) => s.slotId === selectedSlotId || s.deviceId === selectedSlotId) || null;
  }, [selectedSlotId, slots]);

  const setSelectedSlot = useCallback((slot: ParkingSlot | null) => {
    setSelectedSlotId(slot ? slot.slotId || slot.deviceId : null);
  }, []);

  return (
    <ParkingContext.Provider
      value={{
        slots,
        stats,
        events,
        selectedSlot,
        setSelectedSlot,
        awsConfig,
        updateAwsConfig,
        testAwsConnection,
        notifications,
        dismissNotification,
        clearAllNotifications,
        searchQuery,
        setSearchQuery,
        lastRefreshed,
        lastApiTimestamp,
        refreshNow,
        isLoading,
        isInitialLoading,
        apiError,
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
