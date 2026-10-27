import React, { useState } from 'react';
import { useParking } from '../context/ParkingContext';
import {
  Settings,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
  RefreshCw,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    awsConfig,
    updateAwsConfig,
    testAwsConnection,
  } = useParking();

  const [apiBaseUrl, setApiBaseUrl] = useState(awsConfig.apiBaseUrl);
  const [refreshInterval, setRefreshInterval] = useState(awsConfig.refreshIntervalSeconds);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateAwsConfig({
      apiBaseUrl: apiBaseUrl.trim(),
      refreshIntervalSeconds: Number(refreshInterval) || 10,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    updateAwsConfig({ apiBaseUrl: apiBaseUrl.trim() });
    const success = await testAwsConnection();
    setIsTesting(false);
    setTestResult(success ? 'success' : 'error');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              System Settings
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            AWS Connection & Polling Settings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure the deployed API Gateway endpoint and polling frequency.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {awsConfig.apiStatus === 'Healthy' ? (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>API Gateway Connected</span>
            </span>
          ) : (
            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 bg-rose-50 text-rose-800 border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>Connection Issue</span>
            </span>
          )}
        </div>
      </div>

      {/* Security Architecture Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-3">
        <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold">Zero-Credentials Architecture</span>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            The frontend communicates directly with read-only AWS API Gateway endpoints. No AWS access keys, secret keys, or IAM credentials are stored in the browser client.
          </p>
        </div>
      </div>

      {/* Main Configuration Form */}
      <form onSubmit={handleSaveConfig} className="bg-white rounded-xl border border-slate-200 shadow-subtle p-6 space-y-6">
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-bold text-slate-900">API Gateway Endpoint</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              API Base URL
            </label>
            <input
              type="url"
              value={apiBaseUrl}
              onChange={(e) => setApiBaseUrl(e.target.value)}
              placeholder="https://your-api-id.execute-api.ap-southeast-2.amazonaws.com"
              className="w-full text-xs font-mono px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Base URL of the deployed HTTP API Gateway proxying to the read-only Lambda function.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Polling Refresh Interval (Seconds)
            </label>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="text-xs px-3.5 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white cursor-pointer"
            >
              <option value={5}>Every 5 seconds</option>
              <option value={10}>Every 10 seconds</option>
              <option value={15}>Every 15 seconds</option>
              <option value={30}>Every 30 seconds</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Controls how frequently the frontend polls /api/v1/parking for status updates.
            </p>
          </div>
        </div>

        {/* Read-Only Target Resource Info */}
        <div className="border-t border-slate-100 pt-4">
          <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-slate-500" />
            <span>Target AWS Resources</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">AWS Region</span>
              <span className="font-mono font-bold text-slate-800">{awsConfig.region}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-[10px] text-slate-400 block uppercase font-mono">DynamoDB Table</span>
              <span className="font-mono font-bold text-slate-800">{awsConfig.dynamoDbTable}</span>
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-600' : ''}`} />
              <span>Test Connection</span>
            </button>

            {testResult === 'success' && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Reachable & Healthy</span>
              </span>
            )}
            {testResult === 'error' && (
              <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Health check failed</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Settings saved!</span>
              </span>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Configuration</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
