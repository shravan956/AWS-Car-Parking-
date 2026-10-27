"""
SmartPark Cloud — Read-Only Backend Lambda Handler
Function Name: SmartParkApiHandler
Runtime: Python 3.12
Region: ap-southeast-2 (Sydney)
Target DynamoDB Table: IoTDeviceStatus (Partition Key: deviceId String)

Verified DynamoDB Attributes:
  - deviceId: String (e.g. "device-015")
  - slotId: String (e.g. "F2-S05")
  - floor: Number (e.g. 2)
  - status: String ("Available" | "Occupied" | "reserved")
  - occupancy: Number (0 | 1)
  - timestamp: String (ISO-8601, e.g. "2026-10-25T19:30:00Z" or missing)
  - eventId: String UUID (e.g. "3fa85f64-5717-4562-b3fc-2c963f66afa6")

Design Principles:
  1. No unsupported/fabricated fields (distanceCm, batteryLevel, rssi, vehicleId, vehicleType).
  2. Uses actual stored slotId and floor attributes from DynamoDB; does not overwrite with sequential guesses.
  3. Case-insensitive status normalization ('Available' -> 'available', 'Occupied' -> 'occupied').
  4. Validates occupancy type (0/1) and asserts consistency against normalized status.
  5. Never fabricates timestamps: missing or invalid timestamps are reported as unknown freshness.
  6. Handles missing attributes and arbitrary device IDs gracefully.
  7. Handles DynamoDB scan pagination via LastEvaluatedKey.
  8. Historical event querying remains explicitly pending S3 structure verification.
"""

import json
import os
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
import boto3
from botocore.exceptions import ClientError

# ==============================================================================
# Configuration & Environment Variables
# ==============================================================================
AWS_REGION = os.environ.get("AWS_REGION", "ap-southeast-2")
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "IoTDeviceStatus")
HEARTBEAT_TIMEOUT_SECONDS = int(os.environ.get("HEARTBEAT_TIMEOUT_SECONDS", "60"))
CORS_ALLOW_ORIGIN = os.environ.get("CORS_ALLOW_ORIGIN", "*")

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
table = dynamodb.Table(DYNAMODB_TABLE)

# Floor metadata lookup
FLOOR_NAMES: Dict[str, str] = {
    "F1": "Floor 1 (Ground)",
    "F2": "Floor 2 (Mid-Level)",
    "F3": "Floor 3 (Rooftop / EV)",
}


# ==============================================================================
# Helper Functions: HTTP & CORS
# ==============================================================================
def get_cors_headers() -> Dict[str, str]:
    """Standard CORS headers for browser compatibility."""
    return {
        "Access-Control-Allow-Origin": CORS_ALLOW_ORIGIN,
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        "Content-Type": "application/json",
    }


def json_response(status_code: int, body: Any) -> Dict[str, Any]:
    """Formats an API Gateway HTTP API v2 response payload."""
    return {
        "statusCode": status_code,
        "headers": get_cors_headers(),
        "body": json.dumps(body, default=str),
    }


# ==============================================================================
# Helper Functions: DynamoDB Pagination & Data Retrieval
# ==============================================================================
def fetch_all_dynamodb_items() -> List[Dict[str, Any]]:
    """
    Scans the DynamoDB table, handling pagination via LastEvaluatedKey.
    Returns all raw items without truncation.
    """
    items: List[Dict[str, Any]] = []
    scan_kwargs: Dict[str, Any] = {}

    while True:
        response = table.scan(**scan_kwargs)
        items.extend(response.get("Items", []))
        last_eval_key = response.get("LastEvaluatedKey")
        if not last_eval_key:
            break
        scan_kwargs["ExclusiveStartKey"] = last_eval_key

    return items


# ==============================================================================
# Normalization & Validation Functions (Verified Schema)
# ==============================================================================
def normalize_status(raw_status: Any) -> str:
    """
    Normalizes status case-insensitively.
    Supported inputs: 'Available' -> 'available', 'Occupied' -> 'occupied'.
    Preserves 'reserved' if present.
    Unrecognized or missing values return 'unknown'.
    """
    if raw_status is None:
        return "unknown"
    cleaned = str(raw_status).strip().lower()
    if cleaned in ("available", "free", "vacant"):
        return "available"
    if cleaned in ("occupied", "parked", "taken"):
        return "occupied"
    if cleaned == "reserved":
        return "reserved"
    return "unknown"


def validate_occupancy(raw_occupancy: Any, normalized_status: str) -> Tuple[Optional[int], Optional[bool]]:
    """
    Validates occupancy as a binary integer (0 or 1) and checks consistency against status.
    Returns (occupancy_value, is_consistent).
    - If occupancy is missing or non-integer: (None, None)
    - If status is 'available': expected occupancy is 0
    - If status is 'occupied': expected occupancy is 1
    - If status is 'reserved' or 'unknown': consistency cannot be asserted (None)
    """
    if raw_occupancy is None:
        return None, None

    try:
        occ_int = int(raw_occupancy)
    except (ValueError, TypeError):
        return None, False

    if occ_int not in (0, 1):
        return occ_int, False

    if normalized_status == "available":
        return occ_int, (occ_int == 0)
    elif normalized_status == "occupied":
        return occ_int, (occ_int == 1)
    else:
        return occ_int, None


def parse_and_evaluate_timestamp(raw_timestamp: Any) -> Tuple[Optional[str], bool, str]:
    """
    Evaluates freshness of the record timestamp without fabricating current time.
    Returns:
      (iso_timestamp_str, is_online, freshness_label)
      - Missing or empty: (None, False, "unknown")
      - Invalid format: (raw_str, False, "invalid")
      - Within HEARTBEAT_TIMEOUT_SECONDS: (iso_str, True, "fresh")
      - Older than HEARTBEAT_TIMEOUT_SECONDS: (iso_str, False, "stale")
    """
    if not raw_timestamp:
        return None, False, "unknown"

    ts_str = str(raw_timestamp).strip()
    if not ts_str:
        return None, False, "unknown"

    try:
        if ts_str.endswith("Z"):
            dt = datetime.fromisoformat(ts_str[:-1] + "+00:00")
        elif "+" in ts_str or (len(ts_str) > 10 and "-" in ts_str[10:]):
            dt = datetime.fromisoformat(ts_str)
        else:
            dt = datetime.fromisoformat(ts_str).replace(tzinfo=timezone.utc)

        now_utc = datetime.now(timezone.utc)
        diff_seconds = (now_utc - dt).total_seconds()

        if 0 <= diff_seconds <= HEARTBEAT_TIMEOUT_SECONDS:
            return dt.isoformat(), True, "fresh"
        else:
            return dt.isoformat(), False, "stale"
    except Exception:
        return ts_str, False, "invalid"


def resolve_floor_info(raw_floor: Any, slot_id: Optional[str]) -> Tuple[Optional[int], Optional[str], str]:
    """
    Resolves floor number, floorId, and human-readable floorName.
    Uses stored DynamoDB 'floor' attribute first.
    If 'floor' is missing but slotId matches 'F{N}-...', infers floor number from slotId.
    Returns: (floor_number, floor_id, floor_name).
    """
    floor_num: Optional[int] = None

    if raw_floor is not None:
        try:
            floor_num = int(raw_floor)
        except (ValueError, TypeError):
            pass

    if floor_num is None and slot_id:
        m = re.match(r"^F(\d+)-", slot_id)
        if m:
            try:
                floor_num = int(m.group(1))
            except ValueError:
                pass

    if floor_num is not None:
        floor_id = f"F{floor_num}"
        floor_name = FLOOR_NAMES.get(floor_id, f"Floor {floor_num}")
        return floor_num, floor_id, floor_name

    return None, None, "Unassigned Floor"


def normalize_slot_record(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms a raw DynamoDB record into a verified slot object.
    Explicitly excludes unsupported attributes (distanceCm, batteryLevel, rssi, vehicleId, etc.).
    """
    device_id = str(item.get("deviceId", "")).strip()
    raw_slot_id = item.get("slotId")
    slot_id = str(raw_slot_id).strip() if raw_slot_id is not None else None

    raw_floor = item.get("floor")
    floor_num, floor_id, floor_name = resolve_floor_info(raw_floor, slot_id)

    raw_status = item.get("status")
    status = normalize_status(raw_status)

    raw_occ = item.get("occupancy")
    occupancy, occ_consistent = validate_occupancy(raw_occ, status)

    raw_ts = item.get("timestamp")
    formatted_ts, is_online, freshness = parse_and_evaluate_timestamp(raw_ts)

    raw_event_id = item.get("eventId")
    event_id = str(raw_event_id).strip() if raw_event_id is not None else None

    return {
        "slotId": slot_id,
        "deviceId": device_id,
        "floor": floor_num,
        "floorId": floor_id,
        "floorName": floor_name,
        "status": status,
        "occupancy": occupancy,
        "occupancyConsistent": occ_consistent,
        "sensorOnline": is_online,
        "timestamp": formatted_ts,
        "freshness": freshness,
        "eventId": event_id,
    }


def normalize_device_record(item: Dict[str, Any]) -> Dict[str, Any]:
    """
    Transforms a raw DynamoDB record into a verified device telemetry record.
    """
    device_id = str(item.get("deviceId", "")).strip()
    raw_slot_id = item.get("slotId")
    slot_id = str(raw_slot_id).strip() if raw_slot_id is not None else None

    raw_floor = item.get("floor")
    floor_num, floor_id, _ = resolve_floor_info(raw_floor, slot_id)

    raw_status = item.get("status")
    reported_status = normalize_status(raw_status)

    raw_occ = item.get("occupancy")
    occupancy, occ_consistent = validate_occupancy(raw_occ, reported_status)

    raw_ts = item.get("timestamp")
    formatted_ts, is_online, freshness = parse_and_evaluate_timestamp(raw_ts)

    raw_event_id = item.get("eventId")
    event_id = str(raw_event_id).strip() if raw_event_id is not None else None

    device_status = "online" if is_online else "offline"
    if freshness == "unknown":
        device_status = "unknown"

    return {
        "deviceId": device_id,
        "slotId": slot_id,
        "floor": floor_num,
        "floorId": floor_id,
        "status": device_status,
        "reportedStatus": reported_status,
        "occupancy": occupancy,
        "occupancyConsistent": occ_consistent,
        "lastSeen": formatted_ts,
        "freshness": freshness,
        "eventId": event_id,
        "mqttTopic": f"devices/{device_id}/status" if device_id else None,
    }


def build_parking_summary(slots: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Aggregates overall and floor-level metrics from verified slot records.
    """
    total_slots = len(slots)
    available = 0
    occupied = 0
    reserved = 0
    unknown = 0

    floor_groups: Dict[str, Dict[str, Any]] = {}

    for s in slots:
        st = s["status"]
        if st == "available":
            available += 1
        elif st == "occupied":
            occupied += 1
        elif st == "reserved":
            reserved += 1
        else:
            unknown += 1

        f_id = s.get("floorId") or "UNKNOWN"
        f_name = s.get("floorName") or "Unassigned Floor"

        if f_id not in floor_groups:
            floor_groups[f_id] = {
                "floorId": f_id,
                "name": f_name,
                "totalSlots": 0,
                "available": 0,
                "occupied": 0,
                "reserved": 0,
                "unknown": 0,
            }
        floor_groups[f_id]["totalSlots"] += 1
        floor_groups[f_id][st] = floor_groups[f_id].get(st, 0) + 1

    floors_summary = []
    standard_keys = ["F1", "F2", "F3"]
    all_keys = [k for k in standard_keys if k in floor_groups] + [k for k in floor_groups if k not in standard_keys]

    for f_id in all_keys:
        fg = floor_groups[f_id]
        f_total = fg["totalSlots"]
        f_occ = fg["occupied"]
        f_rate = round((f_occ / f_total) * 100) if f_total > 0 else 0
        floors_summary.append({
            "floorId": fg["floorId"],
            "name": fg["name"],
            "totalSlots": f_total,
            "available": fg["available"],
            "occupied": f_occ,
            "reserved": fg["reserved"],
            "unknown": fg["unknown"],
            "occupancyRate": f_rate,
        })

    occupancy_rate = round((occupied / total_slots) * 100) if total_slots > 0 else 0

    return {
        "totalSlots": total_slots,
        "availableSlots": available,
        "occupiedSlots": occupied,
        "reservedSlots": reserved,
        "unknownSlots": unknown,
        "occupancyRate": occupancy_rate,
        "floors": floors_summary,
    }


# ==============================================================================
# Endpoint Handlers
# ==============================================================================
def handle_health() -> Dict[str, Any]:
    """GET /api/v1/health: Verifies DynamoDB connectivity."""
    try:
        table_status = table.table_status
        return json_response(
            200,
            {
                "status": "healthy",
                "region": AWS_REGION,
                "table": DYNAMODB_TABLE,
                "tableStatus": table_status,
                "queryTimestamp": datetime.now(timezone.utc).isoformat(),
                "dynamodbConnected": True,
            },
        )
    except ClientError as e:
        return json_response(
            503,
            {
                "status": "unhealthy",
                "error": str(e),
                "region": AWS_REGION,
                "table": DYNAMODB_TABLE,
                "queryTimestamp": datetime.now(timezone.utc).isoformat(),
                "dynamodbConnected": False,
            },
        )


def handle_parking() -> Dict[str, Any]:
    """
    GET /api/v1/parking: Current State API.
    Retrieves all records from IoTDeviceStatus via paginated scan,
    normalizes attributes using the verified schema, and returns structured JSON.
    """
    try:
        raw_items = fetch_all_dynamodb_items()
        normalized_slots = [normalize_slot_record(item) for item in raw_items]

        # Deterministic sort: floor ascending, then slotId, then deviceId
        def sort_key(s: Dict[str, Any]) -> Tuple[int, str, str]:
            fl = s.get("floor")
            floor_val = fl if fl is not None else 99
            slot_id = s.get("slotId") or ""
            dev_id = s.get("deviceId") or ""
            return (floor_val, slot_id, dev_id)

        normalized_slots.sort(key=sort_key)
        summary = build_parking_summary(normalized_slots)

        return json_response(
            200,
            {
                "total": len(normalized_slots),
                "queryTimestamp": datetime.now(timezone.utc).isoformat(),
                "slots": normalized_slots,
                "summary": summary,
            },
        )
    except ClientError as e:
        return json_response(500, {"error": f"DynamoDB query failed: {str(e)}"})


def handle_devices() -> Dict[str, Any]:
    """
    GET /api/v1/devices: Fleet Inventory API.
    Returns telemetry records for all verified devices in DynamoDB.
    """
    try:
        raw_items = fetch_all_dynamodb_items()
        device_list = [normalize_device_record(item) for item in raw_items]
        device_list.sort(key=lambda d: d.get("deviceId") or "")

        return json_response(
            200,
            {
                "count": len(device_list),
                "queryTimestamp": datetime.now(timezone.utc).isoformat(),
                "devices": device_list,
            },
        )
    except ClientError as e:
        return json_response(500, {"error": f"DynamoDB scan failed: {str(e)}"})


def handle_events() -> Dict[str, Any]:
    """
    GET /api/v1/events: Explicitly separated historical event endpoint.
    Reports pending status until S3 telemetry archive structure is verified.
    """
    return json_response(
        200,
        {
            "status": "HISTORICAL_QUERYING_PENDING_VERIFICATION",
            "message": (
                "Historical event querying requires verification of the S3 archive layout "
                "(bucket: iot-monitor-vedant-2026-503088101284-ap-southeast-2-an). "
                "Live state transitions are tracked in client session memory during active monitoring."
            ),
            "events": [],
        },
    )


# ==============================================================================
# Main Lambda Entry Point (Routing)
# ==============================================================================
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    HTTP API router supporting GET /health, /parking, /devices, /events.
    Compatible with API Gateway HTTP API v2 and REST API proxy events.
    """
    http_method = event.get("requestContext", {}).get("http", {}).get("method") or event.get("httpMethod")
    if http_method == "OPTIONS":
        return {
            "statusCode": 204,
            "headers": get_cors_headers(),
            "body": "",
        }

    raw_path = event.get("rawPath") or event.get("path") or ""

    if raw_path.endswith("/health"):
        return handle_health()
    elif raw_path.endswith("/parking"):
        return handle_parking()
    elif raw_path.endswith("/devices"):
        return handle_devices()
    elif raw_path.endswith("/events"):
        return handle_events()
    else:
        return json_response(
            404,
            {
                "error": "Route Not Found",
                "requestedPath": raw_path,
                "supportedRoutes": [
                    "GET /api/v1/health",
                    "GET /api/v1/parking",
                    "GET /api/v1/devices",
                    "GET /api/v1/events",
                ],
            },
        )
