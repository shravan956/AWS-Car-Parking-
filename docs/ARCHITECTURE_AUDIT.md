# SmartPark Cloud — Frontend Audit and AWS Integration Blueprint

**Role:** Senior Full-Stack Engineer & AWS IoT Solutions Architect  
**Project:** SmartPark Cloud / AWS Car Parking  
**Date:** October 26, 2026  
**Document Status:** Complete Phase 1 Audit & Integration Blueprint (Read-Only Audit — No Application Code Altered)  
**Target Repository:** `c:/Users/Vedant/Desktop/Coding/Projects/AWS/WebApp`

---

## Classification Legend

To maintain strict architectural rigor and prevent unverified assumptions, every external fact, resource, and contract in this document is labeled using one of the following tags:

- `[Reported Configuration]`: Known configuration from prior project setup (cannot be verified directly from the cloned frontend repo).
- `[Confirmed from Repository]`: Inspected directly from source code, configuration files, or build scripts in this repository.
- `[Proposed Design]`: Integration design, data contracts, or architecture proposed for Phase 2 implementation.
- `[Not Independently Verified]`: External detail that still requires validation against live AWS resources or running simulator instances.

---

## 1. Executive Summary

SmartPark Cloud is an IoT-based multi-level parking monitoring application designed to manage 30 parking slots distributed across three floors (10 slots per floor).

### Core Audit Conclusions
1. **Frontend Isolation `[Confirmed from Repository]`:** The cloned repository contains a React 19 + TypeScript + Vite + Tailwind CSS frontend application. It contains **no backend runtime, no API client, no HTTP fetch calls, and no AWS SDK**.
2. **Current Data Flow `[Confirmed from Repository]`:** All 30 slots (`F1-S01` to `F3-S10`), 30 IoT sensor devices, and activity logs are generated in-memory via `src/services/sampleData.ts`. An autonomous browser-side timer in `src/context/ParkingContext.tsx` simulates random vehicle arrivals and departures every 6 seconds, altering distance readings and statuses.
3. **Integration Strategy `[Proposed Design]`:** The existing UI design, styling, component hierarchy, and DEMO simulation must be preserved. In `REAL_AWS` mode, the client-side simulation timer must be disabled, and the application must poll a minimal, read-only Amazon API Gateway HTTP API that reads current device state from DynamoDB (`IoTDeviceStatus`) and historical events from S3.
4. **Data Isolation `[Proposed Design]`:** DEMO mode and AWS mode will be completely decoupled. The frontend will never mix synthetic simulation events with real AWS telemetry, and will never silently fall back to fake data upon network errors.

---

## 2. Actual Frontend Architecture and File Map `[Confirmed from Repository]`

### 2.1 Technology Stack & Tooling
- **Core Library:** React 19.3.1
- **Language:** TypeScript 6.0.3 (Strict mode enabled in `tsconfig.app.json`)
- **Build Tool:** Vite 8.3.5
- **Routing:** React Router v7.18.4 (`BrowserRouter` with nested routes)
- **Styling:** Tailwind CSS 3.4.19 + PostCSS 8.5.31 + Autoprefixer
- **Visualizations:** Recharts 3.10.1 (ResponsiveContainer, AreaChart, BarChart, PieChart)
- **Iconography:** Lucide React 1.61.0
- **Linter:** Oxlint 1.88.0 (`.oxlintrc.json`)

### 2.2 Complete Repository File Tree
```
c:/Users/Vedant/Desktop/Coding/Projects/AWS/WebApp
├── .env                              # Local env file (Ignored in Git, created from .env.example)
├── .env.example                      # Template containing placeholder AWS parameters (us-east-1)
├── .gitignore                        # Git ignore rules (Properly ignores .env, node_modules, dist)
├── .oxlintrc.json                    # Oxlint configuration
├── index.html                        # Single-page application root HTML
├── package.json                      # Project dependencies and script declarations
├── package-lock.json                 # Lockfile for reproducible npm installs
├── postcss.config.js                 # PostCSS configuration for Tailwind CSS
├── README.md                         # Project documentation and conceptual AWS architecture
├── tailwind.config.js                # Tailwind CSS v3 theme, custom brand colors, and shadows
├── tsconfig.app.json                 # TypeScript compiler configuration for client code
├── tsconfig.json                     # TypeScript project references root
├── tsconfig.node.json                # TypeScript compiler configuration for Vite tooling
├── vite.config.ts                    # Vite bundler configuration
├── docs/
│   └── ARCHITECTURE_AUDIT.md         # THIS AUDIT DOCUMENT (Sole Phase 1 deliverable)
├── public/
│   ├── favicon.svg                   # Application favicon
│   └── icons.svg                     # SVG sprite symbols
└── src/
    ├── App.css                       # Application CSS root
    ├── App.tsx                       # Main Router component (React Router v7)
    ├── index.css                     # Tailwind directives, webkit scrollbar, and custom keyframes
    ├── main.tsx                      # React DOM root entry point
    ├── assets/                       # Static images (hero.png, react.svg, vite.svg)
    ├── components/
    │   ├── common/
    │   │   ├── StatCard.tsx          # Metric KPI display card with variant accents
    │   │   └── StatusBadge.tsx       # Standardized status badge (Available, Occupied, Reserved, Offline)
    │   ├── layout/
    │   │   ├── AppLayout.tsx         # Responsive dashboard shell (Desktop Sidebar + Mobile Drawer)
    │   │   ├── Sidebar.tsx           # Dark navigation drawer with live facility meter
    │   │   └── TopNavbar.tsx         # Header with breadcrumbs, simulation controls, notifications, search
    │   └── parking/
    │       ├── ParkCarModal.tsx      # Modal to manually park vehicle with license plate & category
    │       ├── ParkingBayCard.tsx    # Garage-styled card showing bay state, ultrasonic dist, RSSI
    │       └── SlotDetailDrawer.tsx  # Slide-over telemetry inspection drawer & sensor toggle controls
    ├── context/
    │   └── ParkingContext.tsx        # Central in-memory state, timer ticker, and simulation actions
    ├── pages/
    │   ├── ActivityLogsPage.tsx      # Paginated, filterable event table with CSV export
    │   ├── AnalyticsPage.tsx         # Recharts telemetry graphs (Occupancy, Turnover, Utilization)
    │   ├── IoTDevicesPage.tsx        # 30-sensor fleet inventory, RSSI, battery, and fault simulation
    │   ├── LiveParkingPage.tsx       # 30-bay interactive multi-level grid with floor tabs & filters
    │   ├── OverviewPage.tsx          # High-level facility command center with donut & bar metrics
    │   └── SettingsPage.tsx          # Cloud parameter form, simulation speed, and demo data reset
    ├── services/
    │   ├── csvExport.ts              # Browser CSV generator for activity logs
    │   ├── sampleData.ts             # 30-slot deterministic seed generator & vehicle plate generator
    │   └── smartParkService.ts       # ISmartParkService interface & calculateSystemStats helper
    └── types/
        └── parking.ts                # TypeScript interfaces: ParkingSlot, IoTDevice, ActivityEvent, etc.
```

---

## 3. Page-by-Page Data Dependency & Feature Audit `[Confirmed from Repository]`

Every page in the application currently sources data from `useParking()` (`ParkingContext.tsx`), which stores and mutates an in-memory mock dataset.

### 3.1 Data Dependency Matrix

| Page Name | Current Data Source | Data Origin | Consumed Fields | Target AWS API Endpoint `[Proposed Design]` | Actions to Disable / Redesign in AWS Mode `[Proposed Design]` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Overview Dashboard** (`/`) | `useParking()`: `stats`, `events`, `slots`, `lastRefreshed` | **In-memory mock**: Initial seed from `sampleData.ts` continuously altered by simulation ticker. | `stats.*` (total, available, occupied, reserved, unknown, occupancyRate, floor breakdowns), `events` (recent 6 items), `slots` (slotId, floorId, status). | `GET /api/v1/parking` | **Disable:** "Simulate Traffic Event" button. **Add:** Polling status indicator (syncing / synced / error). |
| **Live Parking Bays** (`/live-parking`) | `useParking()`: `slots`, `setSelectedSlot`, `vacateSlot`, `searchQuery` | **In-memory mock**: 30 slots generated by `createInitialSlots()`; state transitions driven by timer ticker. | `slotId`, `floorId`, `floorName`, `status`, `sensorId`, `sensorOnline`, `sensorDistanceCm`, `batteryLevel`, `signalRssi`, `lastUpdated`, `vehicleId`, `vehicleType`, `occupiedSince`, `reservedFor`. | `GET /api/v1/parking` | **Disable / Guard:** "Park Car" modal button, "Vacate Bay" button, and "Reserve" button (hardware ultrasonic sensors report occupancy only; reservations & manual overrides require an authenticated command API). |
| **IoT Sensor Fleet** (`/iot-devices`) | `useParking()`: `devices`, `slots`, `toggleSensor`, `lastRefreshed`, `refreshNow` | **In-memory mock**: 30 devices generated by `createInitialDevices()`. Battery (82–99%) and RSSI (-55 to -80 dBm) are randomized. | `deviceId`, `slotId`, `floorId`, `sensorType`, `status` (`online` \| `offline` \| `degraded`), `batteryLevel`, `rssi`, `distanceCm`, `reportedState`, `firmwareVersion`, `lastSeen`, `mqttTopic`, `macAddress`. | `GET /api/v1/devices` | **Disable:** "Simulate Offline" / "Reconnect" buttons (client cannot toggle real hardware state without an IoT device shadow / MQTT command topic). **Redesign:** "Poll Telemetry" triggers immediate API refresh. |
| **Activity & Audit Logs** (`/activity-logs`) | `useParking()`: `events`, `slots`, `setSelectedSlot` | **In-memory mock**: 9 seed events from `createInitialEvents()` + new synthetic events pushed by simulation loop. | `eventId`, `timestamp`, `slotId`, `floorId`, `eventType`, `previousStatus`, `newStatus`, `vehicleId`, `vehicleType`, `source`, `notes`, `isSimulated`. | `GET /api/v1/events?limit=50` | **Redesign:** Replace local array pagination with API-driven or server-side pagination; CSV export downloads real historical event records. |
| **Facility Analytics** (`/analytics`) | `useParking()`: `stats`; Local hardcoded constants | **Hardcoded & Synthetic**: 24h occupancy trend curve is a static array scaled by current occupancy; hourly turnover is a static 7-point array. | `stats.occupancyRate`, `stats.occupiedSlots`, `stats.totalSlots`, `stats.sensorsOnline`, `stats.floors`. | `GET /api/v1/analytics/occupancy` | **Gate / Label:** In AWS mode, display live derived metrics from DynamoDB (current occupancy, floor utilization) and explicitly label historical curves as *"Accumulating Telemetry / Data Unavailable"* until a true historical time-series API is deployed. |
| **System & AWS Settings** (`/settings`) | `useParking()`: `awsConfig`, `updateAwsConfig`, `simulationInterval`, `resetAllData` | **In-memory form state**: Form inputs update local React context only. | `awsConfig.*` (mode, region, iotEndpoint, mqttTopicPrefix, dynamoDbTable, s3LogBucket), `simulationInterval`. | None (Local frontend configuration) | **Add:** Mode toggle (`DEMO` vs `REAL_AWS`), `API Base URL` input field, connection test button that tests `GET /api/v1/health`. |

### 3.2 Inventory of Frontend Features Currently Depending on Fake Data
1. **Automated Traffic Simulation Loop:** `useEffect` in `ParkingContext.tsx` fires `triggerSimulationTick()` every 3–15 seconds, randomly picking bays to occupy or vacate.
2. **Synthetic License Plates:** 14 hardcoded Indian vehicle plates in `SAMPLE_PLATES` (`sampleData.ts`, lines 9–24), randomly assigned via `getRandomPlate()`.
3. **Synthetic Vehicle Categories:** Randomly assigned categories from `['Sedan', 'SUV', 'EV', 'Hatchback']`.
4. **Synthetic Hardware Metrics:**
   - Battery level: Randomly computed as `Math.floor(82 + Math.random() * 17)` (82%–99%).
   - Signal RSSI: Randomly computed as `Math.floor(-55 - Math.random() * 25)` (-55 to -80 dBm).
   - Sensor Distance: Hardcoded random ranges (20–35 cm when occupied, 240–270 cm when vacant).
   - MAC Addresses: Synthesized hex strings `4C:11:AE:3D:8F:{hex}`.
   - Firmware Version: Hardcoded string `'v2.4.1-aws-iot'`.
5. **Synthetic Fault State:** Slot `F3-S06` (Sensor `SNSR-F3-06`) is hardcoded as offline in `sampleData.ts` (line 76) to demonstrate degraded state.
6. **Hardcoded Historical Analytics (`AnalyticsPage.tsx`):**
   - 24-Hour Trend: Base array `[12, 10, 8, 20, 55, 78, 85, 92, 88, 75, 48, 25]` modulated mathematically by current instantaneous occupancy factor.
   - Hourly Turnover: Hardcoded static array of 7 hours (`08:00` to `20:00`) with static entry/exit counts.
   - Peak Demand Hour: Hardcoded text `"14:00 - 16:00"`.
   - Average Dwell Time: Hardcoded text `"1h 45m"`.

---

## 4. Current Domain Model and Seed Data Mapping `[Confirmed from Repository]`

### 4.1 TypeScript Domain Models (`src/types/parking.ts`)
```typescript
export type SlotStatus = 'available' | 'occupied' | 'reserved' | 'unknown';
export type FloorId = 'F1' | 'F2' | 'F3';
export type VehicleType = 'Sedan' | 'SUV' | 'EV' | 'Hatchback';

export interface ParkingSlot {
  slotId: string;              // e.g. "F1-S01"
  floorId: FloorId;            // "F1" | "F2" | "F3"
  floorName: string;          // e.g. "Floor 1 (Ground)"
  status: SlotStatus;         // 'available' | 'occupied' | 'reserved' | 'unknown'
  sensorId: string;           // e.g. "SNSR-F1-01"
  sensorOnline: boolean;      // boolean
  sensorDistanceCm: number;   // e.g. 28 (occupied) or 260 (empty)
  batteryLevel: number;       // 0 - 100%
  signalRssi: number;         // dBm e.g. -65
  lastUpdated: string;        // ISO-8601 string
  vehicleId?: string;         // License plate e.g. "MH 12 AB 4589"
  vehicleType?: VehicleType;  // "Sedan" | "SUV" | "EV" | "Hatchback"
  occupiedSince?: string;     // ISO-8601 string
  reservedFor?: string;       // Reservation description
}

export type DeviceStatus = 'online' | 'offline' | 'degraded';

export interface IoTDevice {
  deviceId: string;           // In current code: uses sensorId (e.g. "SNSR-F1-01")
  slotId: string;             // e.g. "F1-S01"
  floorId: FloorId;           // "F1" | "F2" | "F3"
  sensorType: 'Ultrasonic HC-SR04' | 'ToF Laser VL53L1X' | 'IR Optical';
  status: DeviceStatus;       // 'online' | 'offline' | 'degraded'
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
  source: string;
  notes?: string;
  isSimulated: boolean;
}
```

### 4.2 Seed-Data Floor Distribution (`src/services/sampleData.ts`)
- **Floor 1 (Ground):** 10 slots (`F1-S01` to `F1-S10`), sensors `SNSR-F1-01` to `SNSR-F1-10`. Baseline: 6 Occupied, 3 Available, 1 Reserved.
- **Floor 2 (Mid-Level):** 10 slots (`F2-S01` to `F2-S10`), sensors `SNSR-F2-01` to `SNSR-F2-10`. Baseline: 4 Occupied, 5 Available, 1 Reserved.
- **Floor 3 (Rooftop / EV):** 10 slots (`F3-S01` to `F3-S10`), sensors `SNSR-F3-01` to `SNSR-F3-10`. Baseline: 3 Occupied, 6 Available, 1 Offline (`F3-S06`).

---

## 5. Proposed Device-to-Slot Mapping `[Proposed Design]`

The physical hardware fleet comprises 30 device nodes named `device-001` through `device-030`. The frontend displays 30 parking bays across 3 floors.

### Proposed 1-to-1 Mapping Table

| Floor | Floor Name | Slot ID | Device ID `[Proposed]` | Current Seed Sensor ID `[Confirmed]` | Verification Status |
| :---: | :---: | :---: | :---: | :---: | :---: |
| **Floor 1** | Ground | `F1-S01` | `device-001` | `SNSR-F1-01` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S02` | `device-002` | `SNSR-F1-02` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S03` | `device-003` | `SNSR-F1-03` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S04` | `device-004` | `SNSR-F1-04` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S05` | `device-005` | `SNSR-F1-05` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S06` | `device-006` | `SNSR-F1-06` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S07` | `device-007` | `SNSR-F1-07` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S08` | `device-008` | `SNSR-F1-08` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S09` | `device-009` | `SNSR-F1-09` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 1** | Ground | `F1-S10` | `device-010` | `SNSR-F1-10` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S01` | `device-011` | `SNSR-F2-01` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S02` | `device-012` | `SNSR-F2-02` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S03` | `device-013` | `SNSR-F2-03` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S04` | `device-014` | `SNSR-F2-04` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S05` | `device-015` | `SNSR-F2-05` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S06` | `device-016` | `SNSR-F2-06` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S07` | `device-017` | `SNSR-F2-07` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S08` | `device-018` | `SNSR-F2-08` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S09` | `device-019` | `SNSR-F2-09` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 2** | Mid-Level | `F2-S10` | `device-020` | `SNSR-F2-10` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S01` | `device-021` | `SNSR-F3-01` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S02` | `device-022` | `SNSR-F3-02` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S03` | `device-023` | `SNSR-F3-03` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S04` | `device-024` | `SNSR-F3-04` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S05` | `device-025` | `SNSR-F3-05` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S06` | `device-026` | `SNSR-F3-06` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S07` | `device-027` | `SNSR-F3-07` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S08` | `device-028` | `SNSR-F3-08` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S09` | `device-029` | `SNSR-F3-09` | `[Proposed Design]` `[Not Independently Verified]` |
| **Floor 3** | Rooftop/EV | `F3-S10` | `device-030` | `SNSR-F3-10` | `[Proposed Design]` `[Not Independently Verified]` |

### Verification Limitation
The external Python simulator or deployed DynamoDB records may or may not include a `slot` or `slotId` attribute in the published payload. If the telemetry payload does not contain a `slot` field, the API normalizer will use this deterministic lookup table to resolve `deviceId` to `slotId` and `floorId`.

---

## 6. Known AWS Resources & Verification Limitations

| AWS Resource | Configuration Value | Expected Function | Evidence Status | Verification Limitations |
| :--- | :--- | :--- | :--- | :--- |
| **Region** | `ap-southeast-2` (Sydney) | Primary cloud region | `[Reported Configuration]` | AWS CLI is not available in local environment; cannot execute `aws configure get region`. |
| **IoT ATS Endpoint** | `a1qbdfujcj1nud-ats.iot.ap-southeast-2.amazonaws.com` | MQTT over TLS broker | `[Reported Configuration]` | Cannot verify TLS connection from local machine. |
| **DynamoDB Table** | `IoTDeviceStatus` | Current device state storage | `[Reported Configuration]` | Table schema, attributes, and secondary indexes cannot be inspected directly. |
| **DynamoDB PK** | `deviceId` (String) | Partition key | `[Reported Configuration]` | Contrasts with frontend code assumption (`slotId`). |
| **S3 Telemetry Bucket** | `iot-monitor-vedant-2026-503088101284-ap-southeast-2-an` | Telemetry event JSON archive | `[Reported Configuration]` | Bucket existence, ACL, and partition structure cannot be verified directly. |
| **IoT Thing** | `device-001` (to `device-030`) | Device registry entity | `[Reported Configuration]` | Registry registration and certificate attachments cannot be inspected. |
| **IoT Policy** | `IoTDeviceSimulatorPolicy` | Client connect/publish policy | `[Reported Configuration]` | Policy statement permissions cannot be inspected. |
| **Ingestion Lambda** | `SmartParkTelemetryProcessor` | Ingests MQTT -> DynamoDB & S3 | `[Reported Configuration]` | Deployed code, IAM execution role, and environment variables cannot be viewed. |
| **IoT Rule** | `SmartParkTelemetryRule` (`SELECT * FROM 'devices/+/status'`) | Forwards telemetry to Lambda | `[Reported Configuration]` `[Not Independently Verified]` | Cannot confirm whether the rule is currently `ENABLED` or connected to the Lambda. |
| **API Gateway** | HTTP API (Target read-path) | Serves data to frontend | `[Proposed Design]` | Does not currently exist; must be provisioned. |
| **Read Lambda** | `SmartParkApiHandler` | Queries DynamoDB for frontend | `[Proposed Design]` | Does not currently exist; must be implemented. |

---

## 7. Proposed Telemetry-to-Frontend Field Mapping `[Proposed Design]`

The telemetry payload published by the simulator and stored in DynamoDB contains raw device readings. The frontend requires a richer domain model. The table below specifies how each field will be populated:

| Raw Telemetry / DynamoDB Field | Frontend Model Field (`ParkingSlot` / `IoTDevice`) | Source Nature | Normalization / Business Rule |
| :--- | :--- | :--- | :--- |
| `deviceId` (e.g. `"device-001"`) | `sensorId` / `deviceId` | **Direct hardware telemetry** | Passed through directly. |
| *Derived from mapping* | `slotId` (e.g. `"F1-S01"`) | **Proposed Mapping Lookup** | If payload includes `slot`, use it; otherwise map `device-001` -> `F1-S01`. |
| *Derived from mapping* | `floorId` (`'F1'` \| `'F2'` \| `'F3'`) | **Proposed Mapping Lookup** | If payload includes `floor`, map `1` -> `'F1'`, `2` -> `'F2'`, `3` -> `'F3'`. |
| *Derived from floorId* | `floorName` | **Derived UI text** | `'F1'` -> `'Floor 1 (Ground)'`, `'F2'` -> `'Floor 2 (Mid-Level)'`, `'F3'` -> `'Floor 3 (Rooftop / EV)'`. |
| `status` (e.g. `"Occupied"`, `"Available"`) | `status` (`'available'` \| `'occupied'` \| `'reserved'` \| `'unknown'`) | **Normalized hardware status** | Case-insensitive mapping: `s.toLowerCase() === 'occupied' ? 'occupied' : s.toLowerCase() === 'available' ? 'available' : 'unknown'`. **Do not infer reservation or custom states from sensor distance.** |
| `distance` or `distanceCm` | `sensorDistanceCm` / `distanceCm` | **Direct hardware telemetry** | Coerce to number: `Math.round(Number(raw.distance \|\| raw.distanceCm \|\| 0))`. |
| `battery` or `batteryLevel` | `batteryLevel` | **Telemetry or Optional** | If reported by hardware, use `Math.round(Number(raw.battery))`; if absent, mark as `undefined` or omit from display rather than faking 95%. |
| `rssi` or `signalRssi` | `signalRssi` / `rssi` | **Telemetry or Optional** | If reported by hardware, use `Number(raw.rssi)`; if absent, display `'---'`. |
| `timestamp` or `lastUpdated` | `lastUpdated` / `lastSeen` | **Direct telemetry metadata** | Parse to ISO-8601 string. If missing, use current server timestamp. |
| *Heartbeat calculation* | `sensorOnline` / `status` | **Derived Freshness Rule** | `sensorOnline = (Date.now() - new Date(lastUpdated).getTime()) < 60000` (online if seen within last 60s). |
| *None (Sensor cannot read plates)* | `vehicleId` | **Unavailable in raw sensor telemetry** | Display `"Vehicle Detected"` or omit; do not fabricate fake plates in AWS mode. |
| *None* | `vehicleType` | **Unavailable in raw sensor telemetry** | Omit or display `undefined` in AWS mode. |
| *None* | `occupiedSince` | **Derived State Transition** | Track timestamp when slot status transitions from available to occupied. |
| *None* | `reservedFor` | **Unavailable in raw sensor telemetry** | Display only if an explicit reservation record is written to DynamoDB. |

---

## 8. Proposed Minimal Read-Only API Contract `[Proposed Design]`

To serve the React frontend without adding unnecessary cloud resources, we propose an Amazon API Gateway (HTTP API v2) backed by a single Python 3.12 Read Lambda (`SmartParkApiHandler`) operating in `ap-southeast-2`.

### Endpoint 1: Health & Connectivity Check
- **Path:** `GET /api/v1/health`
- **Purpose:** Verifies API Gateway routing, Lambda execution, and DynamoDB reachability.
- **Query Parameters:** None.
- **Success Response (`200 OK`):**
  ```json
  {
    "status": "healthy",
    "region": "ap-southeast-2",
    "table": "IoTDeviceStatus",
    "timestamp": "2026-10-26T00:45:00Z",
    "dynamodbConnected": true
  }
  ```
- **Error Response (`503 Service Unavailable`):**
  ```json
  {
    "status": "unhealthy",
    "error": "Unable to connect to DynamoDB table IoTDeviceStatus",
    "timestamp": "2026-10-26T00:45:00Z"
  }
  ```

### Endpoint 2: Real-Time Parking Bay Telemetry
- **Path:** `GET /api/v1/parking`
- **Purpose:** Feeds `OverviewPage` and `LiveParkingPage`. Returns all 30 slots normalized with facility summary stats.
- **Query Parameters:** None.
- **Success Response (`200 OK`):**
  ```json
  {
    "total": 30,
    "lastUpdated": "2026-10-26T00:45:00Z",
    "slots": [
      {
        "slotId": "F1-S01",
        "deviceId": "device-001",
        "floorId": "F1",
        "floorName": "Floor 1 (Ground)",
        "status": "occupied",
        "distanceCm": 28.5,
        "batteryLevel": 94,
        "signalRssi": -62,
        "sensorOnline": true,
        "lastUpdated": "2026-10-26T00:44:52Z"
      }
    ],
    "summary": {
      "totalSlots": 30,
      "availableSlots": 14,
      "occupiedSlots": 15,
      "reservedSlots": 0,
      "unknownSlots": 1,
      "occupancyRate": 50
    }
  }
  ```

### Endpoint 3: IoT Sensor Fleet Inventory
- **Path:** `GET /api/v1/devices`
- **Purpose:** Feeds `IoTDevicesPage`. Returns all 30 hardware nodes with connectivity status.
- **Query Parameters:**
  - `floor` *(optional, string)*: Filter by floor (`F1`, `F2`, `F3`).
  - `status` *(optional, string)*: Filter by status (`online`, `offline`).
- **Success Response (`200 OK`):**
  ```json
  {
    "count": 30,
    "devices": [
      {
        "deviceId": "device-001",
        "slotId": "F1-S01",
        "floorId": "F1",
        "status": "online",
        "distanceCm": 28.5,
        "batteryLevel": 94,
        "rssi": -62,
        "reportedState": "occupied",
        "lastSeen": "2026-10-26T00:44:52Z",
        "mqttTopic": "devices/device-001/status"
      }
    ]
  }
  ```

### Endpoint 4: Recent Activity & Telemetry Events
- **Path:** `GET /api/v1/events`
- **Purpose:** Feeds `ActivityLogsPage` and recent event stream widgets.
- **Query Parameters:**
  - `limit` *(optional, integer, default: 50, max: 100)*: Max events to return.
  - `slotId` *(optional, string)*: Filter events by slot.
- **Success Response (`200 OK`):**
  ```json
  {
    "events": [
      {
        "eventId": "EVT-20261026-0001",
        "timestamp": "2026-10-26T00:44:52Z",
        "slotId": "F1-S01",
        "floorId": "F1",
        "eventType": "VEHICLE_ENTRY",
        "previousStatus": "available",
        "newStatus": "occupied",
        "source": "AWS IoT Core: devices/device-001/status",
        "notes": "Ultrasonic distance changed to 28.5cm"
      }
    ]
  }
  ```

---

## 9. Historical Analytics and Event-Query Limitations `[Proposed Design]`

### 9.1 DynamoDB Storage Boundary
- The `IoTDeviceStatus` DynamoDB table stores only the **latest state** of each device (30 records total, keyed by `deviceId`).
- DynamoDB alone **cannot** answer questions about:
  - 24-hour occupancy trends.
  - Hourly vehicle turnover volume (entries vs. exits).
  - Average dwell times over the past week.

### 9.2 S3 Telemetry Archive Limitations
- Telemetry events are archived in S3 (`iot-monitor-vedant-2026-503088101284-ap-southeast-2-an`).
- **Full Bucket Scans are Prohibited:** S3 is an object store, not a relational database. Scanning thousands of raw JSON files on every HTTP request would introduce prohibitive latency (5–30 seconds) and excessive S3 `GET` request costs.
- **Proposed Solution for Phase 2:**
  1. **Short-Term (API Polling):** Derive instantaneous KPIs (live occupancy rate, vacant counts, floor breakdown) directly from current DynamoDB state.
  2. **Activity Logs:** The ingestion Lambda (`SmartParkTelemetryProcessor`) can optionally write state transitions to a lightweight secondary DynamoDB table (`SmartPark_Events`, PK: `slotId`, SK: `timestamp`) or maintain an in-memory sliding buffer in the Read Lambda.
  3. **Analytics Page:** In `REAL_AWS` mode, the frontend will show live metrics computed from the current 30-slot fleet and display a clear *"Historical Telemetry Accumulating"* notification for the 24h curve rather than fabricating numbers.

---

## 10. DEMO vs. AWS Mode Architecture Design `[Proposed Design]`

The application will maintain clean, strict isolation between `DEMO` mode and `REAL_AWS` mode:

```
                          ┌───────────────────────────┐
                          │    Mode Selector / State  │
                          │   (DEMO vs. REAL_AWS)     │
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 ▼                                             ▼
       ┌───────────────────┐                         ┌───────────────────┐
       │     DEMO MODE     │                         │   REAL_AWS MODE   │
       ├───────────────────┤                         ├───────────────────┤
       │ - In-memory mock  │                         │ - HTTP API Client │
       │   sampleData.ts   │                         │ - 5-sec Polling   │
       │ - 6s Timer Ticker │                         │ - Simulation OFF  │
       │   (arrivals/exits)│                         │ - Manual Park OFF │
       │ - Manual controls │                         │ - Real DynamoDB   │
       │   enabled         │                         │   Normalized State│
       │ - Synthetic plates│                         │ - Explicit error  │
       │   & demo badges   │                         │   banners on fail │
       └───────────────────┘                         └───────────────────┘
```

### Behavioral Safeguards:
1. **No Simulated Overwrites in AWS Mode:** When `mode === 'REAL_AWS'`, `isSimulating` is set to `false`, and `setInterval` simulation is completely deactivated. Local synthetic events are never pushed into the state.
2. **No Silent Fallback:** If the API Gateway request fails or returns an error (network offline, 503, CORS failure), the UI displays an explicit error banner with a retry button. It will **never** silently fall back to `sampleData.ts`.
3. **Action Button Guards:** In AWS mode, the "Park Car", "Vacate Bay", and "Reserve" buttons on `ParkingBayCard.tsx` and `SlotDetailDrawer.tsx` will either be disabled or display an informative tooltip: *"Manual overrides disabled in Real AWS Mode (telemetry driven by hardware sensors)"*.
4. **Visual Indicators:**
   - [Sidebar.tsx](file:///c:/Users/Vedant/Desktop/Coding/Projects/AWS/WebApp/src/components/layout/Sidebar.tsx) footer badge displays `REAL AWS` (green) or `DEMO SIMULATOR` (amber).
   - [TopNavbar.tsx](file:///c:/Users/Vedant/Desktop/Coding/Projects/AWS/WebApp/src/components/layout/TopNavbar.tsx) hides simulation play/pause controls in AWS mode and displays live cloud polling status.

---

## 11. Security and Secret-Management Review `[Confirmed from Repository]`

1. **Git Secret Scan:**
   - Checked `.gitignore`: Properly excludes `.env`, `.env.*` (except `.env.example`), `logs`, `*.log`, `node_modules`, and `dist`.
   - Tracked Git files (`git ls-files`): No private keys, AWS credentials, `.pem`, `.crt`, or `.env` files are tracked in the Git index.
   - Recommendation: Explicitly add `*.pem`, `*.crt`, `*.key`, `*.pfx`, and `secrets/` to `.gitignore`.
2. **Zero Client-Side Credentials:**
   - Under no circumstances will AWS IAM Access Keys (`AKIA...`), Secret Access Keys, session tokens, or X.509 private keys be placed in Vite `.env` files or compiled into client JavaScript bundles.
   - Vite environment variables prefixed with `VITE_` are publicly accessible in browser memory. Only public non-sensitive configuration (API base URL, AWS region name) will be placed in `VITE_*`.
3. **API Security:**
   - The browser connects to Amazon API Gateway over HTTPS (TLS 1.2+).
   - The Read Lambda executes under a dedicated, least-privilege IAM Execution Role allowing only `dynamodb:Scan` and `dynamodb:GetItem` on table `IoTDeviceStatus`.
   - API Gateway must configure strict CORS headers allowing read operations (`GET, OPTIONS`) and standard throttling to mitigate denial-of-service risks.

---

## 12. Required Code Changes Grouped by File `[Proposed Design]`

### Phase 2 Implementation Target Files

| File Path | Nature of Change | Planned Changes |
| :--- | :--- | :--- |
| `.gitignore` | Modification | Add `*.pem`, `*.crt`, `*.key`, `*.pfx`, and `secrets/` to ensure hardware certificates can never be accidentally committed. |
| `.env.example` / `.env` | Modification | Set `VITE_AWS_REGION=ap-southeast-2`, add `VITE_API_BASE_URL=https://{api-id}.execute-api.ap-southeast-2.amazonaws.com`, set `VITE_APP_MODE=DEMO`. |
| `src/types/parking.ts` | Modification | Add `ApiSlotResponse`, `ApiDeviceResponse`, and update `AWSConfig` to support `apiEndpoint` and mode flags. |
| `src/services/normalizers.ts` | **New File** | Pure transformation functions: map `device-001` .. `device-030` to `F1-S01` .. `F3-S10`, case-insensitive status normalizer, distance coercion. |
| `src/services/apiClient.ts` | **New File** | Typed HTTP client for API Gateway endpoints (`/health`, `/parking`, `/devices`, `/events`) with error handling, timeout (5s), and cancellation. |
| `src/services/smartParkService.ts` | Modification | Implement `ISmartParkService` with `DemoSmartParkService` and `AwsSmartParkService`. |
| `src/context/ParkingContext.tsx` | Modification | Introduce mode-dependent state: in `REAL_AWS` mode, disable simulation timer, enable 5-second polling via `apiClient.ts`, track API loading and error states. |
| `src/components/layout/Sidebar.tsx` | Modification | Change hardcoded `"DEMO SIMULATOR"` text to dynamically display active mode (`DEMO` vs `REAL AWS`). |
| `src/components/layout/TopNavbar.tsx` | Modification | Hide simulation controls widget when in `REAL_AWS` mode; show cloud connectivity indicator and manual refresh button. |
| `src/components/parking/ParkingBayCard.tsx` | Modification | Guard manual "Park Car" / "Vacate" actions when in `REAL_AWS` mode. |
| `src/components/parking/SlotDetailDrawer.tsx` | Modification | Display hardware device ID (`device-001`), actual telemetry timestamp, and guard manual action buttons in `REAL_AWS` mode. |
| `src/pages/SettingsPage.tsx` | Modification | Add API Base URL input, region selector defaulting to `ap-southeast-2`, mode selector (`DEMO` vs `REAL_AWS`), and API connectivity test button. |
| `src/pages/AnalyticsPage.tsx` | Modification | Add notice banner in AWS mode explaining live vs. historical telemetry availability. |

---

## 13. Required AWS Changes (Separated from Frontend Work) `[Proposed Design]`

The following backend resources are required to complete the read path. They will be prepared as clean, standalone deployment artifacts:

### 13.1 Read-Path Lambda (`SmartParkApiHandler`)
- **Runtime:** Python 3.12 (or Node.js 20).
- **Handler Code:** `lambda_function.lambda_handler`.
- **Logic:**
  1. Handles routes: `/api/v1/health`, `/api/v1/parking`, `/api/v1/devices`, `/api/v1/events`.
  2. Scans `IoTDeviceStatus` table (30 items total, consumes < 1 RCU).
  3. Maps `deviceId` to slot metadata and computes facility totals (available, occupied, occupancy rate).
  4. Returns standard CORS headers:
     - `Access-Control-Allow-Origin: *`
     - `Access-Control-Allow-Methods: GET, OPTIONS`
     - `Access-Control-Allow-Headers: Content-Type, Authorization`

### 13.2 Amazon API Gateway (HTTP API v2)
- **API Name:** `SmartPark-Cloud-API`
- **Protocol:** HTTP API
- **Routes:**
  - `GET /api/v1/health`
  - `GET /api/v1/parking`
  - `GET /api/v1/devices`
  - `GET /api/v1/events`
  - `$default` (Returns 404 JSON)
- **Integration:** AWS Lambda Proxy integration with `SmartParkApiHandler`.

---

## 14. Concise Checklist of External Facts Needing Verification `[Not Independently Verified]`

Before or during live integration, the following facts must be manually checked in the AWS Management Console or via AWS CLI:

- [ ] **IoT Topic Rule Status:** Verify that rule `SmartParkTelemetryRule` exists, is `ENABLED`, and its SQL query is `SELECT * FROM 'devices/+/status'`.
- [ ] **Ingestion Lambda Trigger:** Verify that IoT Core has `lambda:InvokeFunction` permission on `SmartParkTelemetryProcessor`.
- [ ] **Ingestion Lambda Code & Environment:** Verify that `SmartParkTelemetryProcessor` has environment variables `DYNAMODB_TABLE=IoTDeviceStatus`, `S3_BUCKET=iot-monitor-vedant-2026-503088101284-ap-southeast-2-an`, and `AWS_REGION=ap-southeast-2`.
- [ ] **DynamoDB Table Status:** Verify table `IoTDeviceStatus` exists in `ap-southeast-2` and its primary key is `deviceId` (String).
- [ ] **Simulator Payload Structure:** Run one simulator iteration and inspect the DynamoDB item to verify exact attribute names (`distance` vs `distanceCm`, `battery`, `status` casing, timestamp format).
- [ ] **S3 Telemetry Bucket Access:** Verify that the bucket exists and that the ingestion Lambda has `s3:PutObject` permissions.

---

## 15. Phased Implementation Roadmap & Acceptance Criteria `[Proposed Design]`

### Phase 2 Implementation Steps

```
Step 2.1: Secrets & Config Hardening (.gitignore, .env.example, .env)
    │
    ▼
Step 2.2: Backend Read-Path Lambda & API Gateway Spec (Standalone Lambda script)
    │
    ▼
Step 2.3: Frontend Normalizers & Typed API Client (normalizers.ts, apiClient.ts)
    │
    ▼
Step 2.4: Dual-Mode Service Layer & State Engine (DEMO vs REAL_AWS in ParkingContext)
    │
    ▼
Step 2.5: UI Page Integration & Simulation Decoupling (Overview, Live Grid, Fleet, Settings)
    │
    ▼
Step 2.6: Analytics Gating & Historical Data Handling (AnalyticsPage)
    │
    ▼
Step 2.7: Production Build Verification & End-to-End Testing (npm run build, oxlint)
```

### Acceptance Criteria
1. **Build Integrity:** `npm run build` (`tsc -b && vite build`) and `npm run lint` compile with zero errors.
2. **UI & Routing Preservation:** All 6 existing pages, drawer inspection, garage visual layouts, and color codes (Green = Available, Red = Occupied, Amber = Reserved, Grey = Offline) continue to work seamlessly.
3. **Mode Independence:**
   - In `DEMO` mode, the existing in-memory simulation runs without network requests.
   - In `REAL_AWS` mode, client-side simulation is completely disabled, and the app polls the configured API Gateway endpoint.
4. **Resilience & Honest Error States:** API network errors produce clear, visible error notifications; the app never silently masks failures with fake data.
5. **Zero Credential Leakage:** No AWS keys, tokens, or private certificates are stored in Git or bundled in client-side code.
