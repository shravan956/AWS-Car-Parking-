# SmartPark Cloud — Backend Deployment & API Specification

**Component:** Read-Only Backend Lambda & API Gateway  
**Region:** `ap-southeast-2` (Sydney)  
**Target Table:** `IoTDeviceStatus` (Partition Key: `deviceId` String)  
**Status:** Standalone Artifacts (Verified against live AWS DynamoDB data)

---

## 1. Verified DynamoDB Schema & Data Attributes

Based on verified AWS CLI read-only inspection of table `IoTDeviceStatus` (Region `ap-southeast-2`, 30 items, status `ACTIVE`, Partition Key `deviceId`):

### 1.1 Verified Attributes (Sampled Records)
| Attribute | DynamoDB Type | Sample Value | Verified Meaning |
| :--- | :--- | :--- | :--- |
| `deviceId` | String (S) | `"device-015"` | Unique hardware identifier (Partition Key) |
| `slotId` | String (S) | `"F2-S05"` | Physical parking slot identifier |
| `floor` | Number (N) | `2` | Floor number (1, 2, or 3) |
| `status` | String (S) | `"Available"`, `"Occupied"` | Stored state string |
| `occupancy` | Number (N) | `0`, `1` | Binary occupancy indicator (0 = free, 1 = occupied) |
| `timestamp` | String (S) | `"2026-10-25T19:30:00Z"` | ISO-8601 telemetry event timestamp (may be missing) |
| `eventId` | String (S) | `"3fa85f64-5717-4562-b3fc-2c963f66afa6"` | Event UUID |

### 1.2 Unsupported / Fabricated Fields Explicitly Removed
The following attributes previously assumed or mocked in frontend components **do not exist** in the verified DynamoDB telemetry data and have been removed from the backend API:
- `distanceCm` / `distance`: Ultrasonic distance reading is not stored in DynamoDB.
- `batteryLevel` / `battery`: Battery telemetry is not present.
- `rssi` / `signalRssi`: WiFi signal strength is not present.
- `vehicleId`: License plate / vehicle identifier is not captured.
- `vehicleType`: Vehicle categorization is not captured.

---

## 2. API Contract & Response Payloads

### 2.1 `GET /api/v1/health`
Verifies DynamoDB connectivity.
```json
{
  "status": "healthy",
  "region": "ap-southeast-2",
  "table": "IoTDeviceStatus",
  "tableStatus": "ACTIVE",
  "queryTimestamp": "2026-10-26T01:45:00.000000+00:00",
  "dynamodbConnected": true
}
```

### 2.2 `GET /api/v1/parking` (Current State API)
Scans table `IoTDeviceStatus` with full pagination support (`LastEvaluatedKey`), normalizes records, and aggregates floor & facility metrics.

```json
{
  "total": 30,
  "queryTimestamp": "2026-10-26T01:45:00.000000+00:00",
  "slots": [
    {
      "slotId": "F2-S05",
      "deviceId": "device-015",
      "floor": 2,
      "floorId": "F2",
      "floorName": "Floor 2 (Mid-Level)",
      "status": "available",
      "occupancy": 0,
      "occupancyConsistent": true,
      "sensorOnline": true,
      "timestamp": "2026-10-25T19:30:00+00:00",
      "freshness": "fresh",
      "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    },
    {
      "slotId": "F3-S01",
      "deviceId": "device-021",
      "floor": 3,
      "floorId": "F3",
      "floorName": "Floor 3 (Rooftop / EV)",
      "status": "available",
      "occupancy": 0,
      "occupancyConsistent": true,
      "sensorOnline": true,
      "timestamp": "2026-10-25T19:30:00+00:00",
      "freshness": "fresh",
      "eventId": "8b92ef11-09ab-4c3d-bc8e-1f2a3456789a"
    },
    {
      "slotId": "F3-S10",
      "deviceId": "device-030",
      "floor": 3,
      "floorId": "F3",
      "floorName": "Floor 3 (Rooftop / EV)",
      "status": "occupied",
      "occupancy": 1,
      "occupancyConsistent": true,
      "sensorOnline": true,
      "timestamp": "2026-10-25T19:30:00+00:00",
      "freshness": "fresh",
      "eventId": "1234abcd-5678-ef01-2345-6789abcdef01"
    }
  ],
  "summary": {
    "totalSlots": 30,
    "availableSlots": 24,
    "occupiedSlots": 6,
    "reservedSlots": 0,
    "unknownSlots": 0,
    "occupancyRate": 20,
    "floors": [
      {
        "floorId": "F1",
        "name": "Floor 1 (Ground)",
        "totalSlots": 10,
        "available": 8,
        "occupied": 2,
        "reserved": 0,
        "unknown": 0,
        "occupancyRate": 20
      },
      {
        "floorId": "F2",
        "name": "Floor 2 (Mid-Level)",
        "totalSlots": 10,
        "available": 9,
        "occupied": 1,
        "reserved": 0,
        "unknown": 0,
        "occupancyRate": 10
      },
      {
        "floorId": "F3",
        "name": "Floor 3 (Rooftop / EV)",
        "totalSlots": 10,
        "available": 7,
        "occupied": 3,
        "reserved": 0,
        "unknown": 0,
        "occupancyRate": 30
      }
    ]
  }
}
```

### 2.3 `GET /api/v1/devices` (Fleet Inventory API)
Returns hardware status and communication metadata for every verified device in DynamoDB.

```json
{
  "count": 30,
  "queryTimestamp": "2026-10-26T01:45:00.000000+00:00",
  "devices": [
    {
      "deviceId": "device-015",
      "slotId": "F2-S05",
      "floor": 2,
      "floorId": "F2",
      "status": "online",
      "reportedStatus": "available",
      "occupancy": 0,
      "occupancyConsistent": true,
      "lastSeen": "2026-10-25T19:30:00+00:00",
      "freshness": "fresh",
      "eventId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "mqttTopic": "devices/device-015/status"
    }
  ]
}
```

### 2.4 `GET /api/v1/events` (Historical Events API)
Reports pending status until the S3 archive bucket partition layout is verified.
```json
{
  "status": "HISTORICAL_QUERYING_PENDING_VERIFICATION",
  "message": "Historical event querying requires verification of the S3 archive layout (bucket: iot-monitor-vedant-2026-503088101284-ap-southeast-2-an). Live state transitions are tracked in client session memory during active monitoring.",
  "events": []
}
```

---

## 3. Data Integrity & Normalization Rules

1. **Mapping Source of Truth:**
   - The stored `slotId` and `floor` attributes from DynamoDB are preserved as the definitive source of truth.
   - The handler does NOT overwrite valid DynamoDB mappings with provisional sequential guesses.
2. **Status Normalization:**
   - `"Available"` → `"available"`
   - `"Occupied"` → `"occupied"`
   - Preserves `"reserved"` if present.
   - Any other value or missing value → `"unknown"`.
3. **Occupancy Validation & Consistency:**
   - Validates that `occupancy` is binary integer `0` or `1`.
   - Checks consistency with `status`:
     - `available` + `0` => `occupancyConsistent: true`
     - `occupied` + `1` => `occupancyConsistent: true`
     - Conflicting states (e.g. `available` + `1`) => `occupancyConsistent: false`
     - Missing or unrecognized states => `occupancyConsistent: null`
4. **Timestamp Integrity (No Fabrication):**
   - The handler never fabricates timestamps using `datetime.now()` for slot records.
   - If `timestamp` is missing or invalid: `timestamp: null`, `freshness: "unknown"`, `sensorOnline: false`.
   - If present and within `HEARTBEAT_TIMEOUT_SECONDS` (default 60s): `freshness: "fresh"`, `sensorOnline: true`.
   - If older than threshold: `freshness: "stale"`, `sensorOnline: false`.
5. **Missing Fields & Unexpected Device IDs:**
   - If `slotId` is missing: `slotId: null`.
   - If `floor` is missing: infers floor from `slotId` (e.g. `"F2-S05"` => `2`) if matching standard pattern; otherwise `floor: null`, `floorId: null`, `floorName: "Unassigned Floor"`.
   - Arbitrary or unexpected device IDs are returned with their actual ID without inventing mappings.
6. **DynamoDB Pagination:**
   - Implements `LastEvaluatedKey` loop in `fetch_all_dynamodb_items()` to ensure all items are read regardless of DynamoDB 1MB response limits.

---

## 4. Least-Privilege IAM Execution Policy

The Lambda function `SmartParkApiHandler` requires **read-only access to a single DynamoDB table** and permission to write execution logs to Amazon CloudWatch:

### 4.1 IAM Policy Document (`SmartParkApiReadOnlyPolicy`)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DynamoDBReadOnlyAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:Scan",
        "dynamodb:DescribeTable"
      ],
      "Resource": "arn:aws:dynamodb:ap-southeast-2:*:table/IoTDeviceStatus"
    },
    {
      "Sid": "CloudWatchLogsAccess",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:ap-southeast-2:*:log-group:/aws/lambda/SmartParkApiHandler:*"
    }
  ]
}
```

### 4.2 Trust Policy (AssumeRole for Lambda)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

---

## 5. Deployment Instructions (For Review Only — Do Not Execute Until Approved)

```bash
# 1. Package handler
cd backend
zip -r function.zip lambda_function.py

# 2. Deploy Lambda function
aws lambda create-function \
  --function-name SmartParkApiHandler \
  --runtime python3.12 \
  --role arn:aws:iam::<ACCOUNT_ID>:role/SmartParkApiExecutionRole \
  --handler lambda_function.lambda_handler \
  --zip-file fileb://function.zip \
  --region ap-southeast-2 \
  --environment "Variables={DYNAMODB_TABLE=IoTDeviceStatus,HEARTBEAT_TIMEOUT_SECONDS=60,CORS_ALLOW_ORIGIN=*}"

# 3. Create HTTP API v2 on API Gateway
aws apigatewayv2 create-api \
  --name SmartPark-Cloud-API \
  --protocol-type HTTP \
  --cors-configuration "AllowOrigins=*,AllowMethods=GET,OPTIONS,AllowHeaders=Content-Type,Authorization" \
  --region ap-southeast-2
```

---

## 6. S3 Storage Analysis: Why S3 is Insufficient for Interactive Event Queries

1. **Object Store vs. Query Engine:** S3 stores individual JSON objects. It lacks B-tree indexing, secondary indexes, pagination, and range queries.
2. **Interactive Latency:** S3 `ListObjectsV2` + multiple `GetObject` operations require several seconds of round-trips for each dashboard refresh.
3. **HTTP API Cost:** S3 charges per 1,000 `GET` requests ($0.0004). At high polling frequencies, this generates thousands of redundant requests.
4. **Current Recommendation:** Live state transitions are monitored in-memory in the client session. If persistent server-side audit logs are required, a DynamoDB events table or Amazon Athena over S3 can be evaluated in a later phase.
