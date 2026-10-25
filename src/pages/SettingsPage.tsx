import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import {
  Settings,
  Cloud,
  Database,
  Radio,
  FileBox,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Cpu,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    awsConfig,
    updateAwsConfig,
    simulationInterval,
    setSimulationInterval,
    isSimulating,
    toggleSimulation,
    resetAllData,
  } = useParking();

  const [region, setRegion] = useState(awsConfig.region);
  const [iotEndpoint, setIotEndpoint] = useState(awsConfig.iotEndpoint);
  const [mqttPrefix, setMqttPrefix] = useState(awsConfig.mqttTopicPrefix);
  const [dynamoTable, setDynamoTable] = useState(awsConfig.dynamoDbTable);
  const [s3Bucket, setS3Bucket] = useState(awsConfig.s3LogBucket);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateAwsConfig({
      region,
      iotEndpoint,
      mqttTopicPrefix: mqttPrefix,
      dynamoDbTable: dynamoTable,
      s3LogBucket: s3Bucket,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleConfirmReset = () => {
    resetAllData();
    setShowResetConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-semibold text-brand-700 uppercase tracking-wider">
              Control Plane Configuration
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            System & AWS Cloud Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure application runtime mode, AWS IoT Core parameters, and simulation engine controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Operational Mode: Demo Fleet</span>
          </span>
        </div>
      </div>

      {/* Security Note Alert */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-900 flex items-start gap-3">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Enterprise Cloud Security Architecture:</span>
          <p className="text-blue-800 leading-relaxed">
            Per strict AWS Well-Architected Security standards, IAM credentials (Access Key ID and Secret Access Key)
            are <strong className="font-semibold">never</strong> stored or transmitted in browser frontend applications.
            In production deployments, real-time telemetry is piped via Amazon Cognito authenticated AppSync GraphQL
            subscriptions or AWS API Gateway WebSockets.
          </p>
        </div>
      </div>

      {/* AWS Cloud Infrastructure Configuration */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 space-y-5">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">AWS Cloud Resource Mapping</h3>
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            Current Status: Not Configured (Demo Provider Active)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* AWS Region */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">AWS Region</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
              <option value="us-west-2">us-west-2 (Oregon)</option>
              <option value="ap-south-1">ap-south-1 (Mumbai)</option>
              <option value="eu-west-1">eu-west-1 (Ireland)</option>
              <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Primary cloud region hosting IoT Broker and DynamoDB tables.
            </span>
          </div>

          {/* AWS IoT Core Broker Endpoint */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              AWS IoT Core Endpoint (ATS)
            </label>
            <input
              type="text"
              value={iotEndpoint}
              onChange={(e) => setIotEndpoint(e.target.value)}
              placeholder="e.g. a3xxxxxxxx-ats.iot.us-east-1.amazonaws.com"
              className="w-full px-3 py-2 font-mono text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              MQTT broker endpoint for ultrasonic sensor payload ingestion.
            </span>
          </div>

          {/* MQTT Topic Prefix */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">MQTT Topic Prefix</label>
            <input
              type="text"
              value={mqttPrefix}
              onChange={(e) => setMqttPrefix(e.target.value)}
              placeholder="e.g. smartpark/slots"
              className="w-full px-3 py-2 font-mono text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Pub/Sub hierarchical namespace for all 30 slot nodes.
            </span>
          </div>

          {/* DynamoDB Slot State Table */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Amazon DynamoDB State Table
            </label>
            <input
              type="text"
              value={dynamoTable}
              onChange={(e) => setDynamoTable(e.target.value)}
              placeholder="SmartPark_Slot_State"
              className="w-full px-3 py-2 font-mono text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Single-digit millisecond latency state cache for 30 slots.
            </span>
          </div>

          {/* S3 Archival Bucket */}
          <div className="md:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1.5">
              Amazon S3 Telemetry Audit Bucket
            </label>
            <input
              type="text"
              value={s3Bucket}
              onChange={(e) => setS3Bucket(e.target.value)}
              placeholder="smartpark-cloud-telemetry-archive"
              className="w-full px-3 py-2 font-mono text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Parquet formatted raw audit logs partitioned by year/month/day.
            </span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span>Configuration updated successfully!</span>
              </span>
            )}
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
          >
            <Save className="w-4 h-4" />
            <span>Save Cloud Configuration</span>
          </button>
        </div>
      </form>

      {/* Real-Time Simulation Engine Settings */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-subtle p-5 space-y-4">
        <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">Traffic Simulation Engine</h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
            {isSimulating ? 'Running' : 'Paused'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Live Stream Telemetry Status
            </label>
            <button
              type="button"
              onClick={toggleSimulation}
              className={`w-full py-2.5 px-4 rounded-md font-semibold text-xs border transition-colors flex items-center justify-center gap-2 ${
                isSimulating
                  ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <span>{isSimulating ? 'Pause Automated Traffic' : 'Start Automated Traffic'}</span>
            </button>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Controls background random car arrivals and departures.
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">
              Simulation Telemetry Cadence
            </label>
            <select
              value={simulationInterval}
              onChange={(e) => setSimulationInterval(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-md border border-slate-300 bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={3}>Fast Cadence (Every 3 seconds)</option>
              <option value={6}>Standard Cadence (Every 6 seconds)</option>
              <option value={10}>Relaxed Cadence (Every 10 seconds)</option>
              <option value={15}>Slow Cadence (Every 15 seconds)</option>
            </select>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Frequency of simulated ultrasonic telemetry events.
            </span>
          </div>
        </div>
      </div>

      {/* Danger Zone: Reset Simulation Data */}
      <div className="bg-white rounded-xl border border-rose-200 shadow-subtle p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-rose-600" />
              <span>Reset Parking Facility Data</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Restore the initial 30-slot distribution baseline and clear simulated activity logs.
            </p>
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            Reset Demo Data
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-rose-100 text-rose-600">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Reset Simulation Data?</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  This will reset all 30 parking slots back to the initial demo baseline.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
