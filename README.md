# SmartPark Cloud

**Cloud-Based Smart Multi-Level Parking Management System Using AWS IoT**

SmartPark Cloud is an enterprise-grade IoT parking management console engineered to monitor, simulate, and manage 30 multi-level parking slots across three floors (Floor 1 Ground, Floor 2 Mid-Level, Floor 3 Rooftop/EV) in real time.

---

## 🚀 Key Features

- **Centralized Typed State**: Exactly 30 parking slots (`F1-S01` to `F1-S10`, `F2-S01` to `F2-S10`, `F3-S01` to `F3-S10`) synchronized across all views without hardcoding.
- **Dynamic Real-Time Availability States**:
  - 🟢 **Green (`#16a34a`)**: Available / Vacant bay (ultrasonic distance > 200cm).
  - 🔴 **Red (`#dc2626`)**: Occupied bay with detected vehicle license plate and dwell time.
  - 🟡 **Amber (`#d97706`)**: Reserved bay for app bookings or VIP parking.
  - ⚪ **Grey (`#64748b`)**: Sensor offline / degraded telemetry.
- **Interactive Bay Controls**:
  - Park vehicle with custom license plate and vehicle type (Sedan, SUV, EV, Hatchback).
  - Vacate occupied bays with instant state propagation and event generation.
  - Reserve / hold bays.
  - Simulate hardware faults and sensor reconnections.
- **Live Background Traffic Simulator**:
  - Automated random vehicle arrivals and departures with configurable cadence (3s, 6s, 10s, 15s).
  - Pause/resume controls and one-click manual event trigger.
- **IoT Fleet Defender**:
  - Full inventory of 30 hardware nodes with distance (cm), battery (%), signal RSSI (dBm), and MQTT topics.
- **Audit & Activity Logs**:
  - Filterable, sortable, and paginated event table.
  - One-click CSV export of activity logs.
- **Analytics & Recharts Visualizations**:
  - 24-hour occupancy trend area chart.
  - Hourly turnover bar chart (entries vs exits).
  - Multi-level floor utilization comparison.
  - Occupancy distribution donut chart.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v3 (Enterprise Cloud Console Design)
- **Icons**: Lucide React
- **Visualizations**: Recharts
- **Routing**: React Router v7

---

## ☁️ Future Production AWS Architecture

```
[ Ultrasonic Sensors / ESP32 ] 
              │ (MQTT over TLS via X.509 certificates)
              ▼
    [ AWS IoT Core Broker ]
              │ (IoT Topic Rule: smartpark/slots/+/telemetry)
              ▼
       [ AWS Lambda ] 
        (Threshold calculation: <50cm = Occupied, >150cm = Vacant)
         ┌────┴──────────────────────────┐
         ▼                               ▼
[ Amazon DynamoDB ]              [ Amazon S3 ]
(Single-digit ms slot state)     (Historical Parquet logs)
         │                               │
         ▼                               ▼
[ AWS AppSync / API Gateway ]    [ Amazon Athena / QuickSight ]
(WebSocket / GraphQL)            (Long-term BI Analytics)
         │
         ▼
[ SmartPark Cloud React Console ]
```

### Security Compliance:
- Never expose IAM access keys or secrets in client browser bundles.
- Use Amazon Cognito User Pools for role-based authentication (RBAC).

---

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Build Production Bundle
```bash
npm run build
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── common/         # StatCard, StatusBadge
│   ├── layout/         # AppLayout, Sidebar, TopNavbar
│   └── parking/        # ParkingBayCard, SlotDetailDrawer, ParkCarModal
├── context/
│   └── ParkingContext.tsx # Centralized 30-slot store and simulation engine
├── pages/
│   ├── OverviewPage.tsx    # Command center dashboard
│   ├── LiveParkingPage.tsx # Garage-style 30-bay grid
│   ├── IoTDevicesPage.tsx  # 30-sensor fleet manager
│   ├── ActivityLogsPage.tsx# Event stream & CSV export
│   ├── AnalyticsPage.tsx   # Recharts telemetry graphs
│   └── SettingsPage.tsx    # AWS config & demo mode controls
├── services/
│   ├── sampleData.ts       # Initial 30-slot baseline
│   ├── smartParkService.ts # Service interfaces & architecture specs
│   └── csvExport.ts        # CSV download utility
└── types/
    └── parking.ts          # Strictly typed models
```
