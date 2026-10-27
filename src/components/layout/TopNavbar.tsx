import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useParking } from '../../context/ParkingContext';
import {
  Search,
  Bell,
  RefreshCw,
  Menu,
  X,
  AlertTriangle,
  CheckCircle2,
  Car,
} from 'lucide-react';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const {
    notifications,
    dismissNotification,
    clearAllNotifications,
    searchQuery,
    setSearchQuery,
    lastApiTimestamp,
    lastRefreshed,
    refreshNow,
    awsConfig,
    isLoading,
  } = useParking();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/':
        return { title: 'Monitoring Dashboard', category: 'SmartPark Overview' };
      case '/live-parking':
        return { title: 'Live Parking Bays', category: '3-Floor Status Grid' };
      case '/iot-devices':
        return { title: 'IoT Device Inventory', category: 'DynamoDB Telemetry Nodes' };
      case '/activity-logs':
        return { title: 'Activity Logs', category: 'Session State Changes' };
      case '/analytics':
        return { title: 'Occupancy Analytics', category: 'Live Capacity Breakdown' };
      case '/settings':
        return { title: 'API & System Settings', category: 'AWS Configuration' };
      default:
        return { title: 'Console', category: 'SmartPark' };
    }
  };

  const pageMeta = getPageTitle(location.pathname);
  const unreadCount = notifications.length;

  const formattedLastUpdated = lastApiTimestamp
    ? new Date(lastApiTimestamp).toLocaleTimeString()
    : lastRefreshed
    ? lastRefreshed.toLocaleTimeString()
    : 'Connecting...';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-xs">
      {/* Left: Mobile hamburger + Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider hidden sm:inline">
              {pageMeta.category}
            </span>
            <span className="text-slate-300 hidden sm:inline">/</span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              {pageMeta.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Center: Search input */}
      <div className="hidden md:flex items-center max-w-xs w-full mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bay ID (e.g. F1-S01) or device..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Right: AWS API connection indicator, timestamp, notifications, refresh */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Small AWS API Reachability Indicator */}
        <div className="flex items-center">
          {awsConfig.apiStatus === 'Healthy' ? (
            <span
              className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-xs font-semibold"
              title="AWS API Gateway and DynamoDB are reachable"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline">AWS API:</span>
              <span>Reachable</span>
            </span>
          ) : awsConfig.apiStatus === 'Checking' || isLoading ? (
            <span className="inline-flex items-center gap-1.5 text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 text-xs font-semibold">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-600" />
              <span>Checking AWS...</span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1.5 text-rose-800 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200 text-xs font-semibold"
              title={awsConfig.lastApiError || 'AWS API is unreachable'}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>AWS Unreachable</span>
            </span>
          )}
        </div>

        {/* Verified Last Updated Time */}
        <div className="hidden lg:flex items-center text-xs text-slate-500 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          <span className="text-slate-400 mr-1.5">Updated:</span>
          <span className="font-semibold text-slate-700">{formattedLastUpdated}</span>
        </div>

        {/* Notifications Dropdown (Session transitions only) */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  Live State Transitions
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No slot state changes observed in current session.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-3 hover:bg-slate-50 transition-colors flex items-start justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5">
                          {n.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Car className="w-4 h-4 text-rose-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{n.title}</div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Manual Refresh Button */}
        <button
          onClick={refreshNow}
          disabled={isLoading}
          title={`Click to refresh data from AWS (Updated: ${formattedLastUpdated})`}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
