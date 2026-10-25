import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useParking } from '../../context/ParkingContext';
import {
  Search,
  Bell,
  Play,
  Pause,
  RefreshCw,
  Globe,
  Menu,
  X,
  Zap,
  CheckCircle,
  AlertTriangle,
  Info,
  Car,
} from 'lucide-react';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const {
    isSimulating,
    toggleSimulation,
    simulationInterval,
    setSimulationInterval,
    triggerManualEvent,
    notifications,
    dismissNotification,
    clearAllNotifications,
    searchQuery,
    setSearchQuery,
    lastRefreshed,
    refreshNow,
    awsConfig,
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
        return { title: 'System Overview', category: 'SmartPark Dashboard' };
      case '/live-parking':
        return { title: 'Live Parking Bays', category: '30 Slots Across 3 Floors' };
      case '/iot-devices':
        return { title: 'IoT Sensors & Gateway', category: 'AWS IoT Device Defender' };
      case '/activity-logs':
        return { title: 'Activity & Audit Logs', category: 'Event Stream & Export' };
      case '/analytics':
        return { title: 'Parking Analytics', category: 'Telemetry & Utilization' };
      case '/settings':
        return { title: 'System & AWS Settings', category: 'Configuration & Modes' };
      default:
        return { title: 'Console', category: 'SmartPark Cloud' };
    }
  };

  const pageMeta = getPageTitle(location.pathname);
  const unreadCount = notifications.length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0 shadow-xs">
      {/* Left: Mobile hamburger + Page Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-md hover:bg-slate-100 text-slate-600"
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
            placeholder="Search bay (F1-S01), plate, sensor..."
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

      {/* Right: Simulator Controls, AWS Region, Notifications, Refresh */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Simulation Controls Widget */}
        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
          <button
            onClick={toggleSimulation}
            title={isSimulating ? 'Pause Live Simulation' : 'Resume Live Simulation'}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isSimulating
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-200'
            }`}
          >
            {isSimulating ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                <Pause className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Live Stream</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Resume</span>
              </>
            )}
          </button>

          {/* Quick trigger tick button */}
          <button
            onClick={triggerManualEvent}
            title="Trigger Instant Vehicle Event"
            className="p-1 rounded-md hover:bg-slate-200 text-slate-600 ml-1 transition-colors"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600" />
          </button>

          {/* Speed selector */}
          <select
            value={simulationInterval}
            onChange={(e) => setSimulationInterval(Number(e.target.value))}
            title="Simulation Speed"
            className="bg-transparent text-[11px] font-medium text-slate-700 border-none rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
          >
            <option value={3}>3s</option>
            <option value={6}>6s</option>
            <option value={10}>10s</option>
          </select>
        </div>

        {/* AWS Region Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600">
          <Globe className="w-3.5 h-3.5 text-blue-600" />
          <span className="font-mono text-[11px] font-medium">{awsConfig.region}</span>
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 relative transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900 uppercase tracking-wide">
                  Real-Time Notifications
                </span>
                {notifications.length > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Clear all
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No new telemetry notifications.
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
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : n.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                          ) : n.type === 'alert' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-600" />
                          ) : (
                            <Car className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{n.title}</div>
                          <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">
                            {n.message}
                          </p>
                          <span className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(n.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => dismissNotification(n.id)}
                        className="text-slate-400 hover:text-slate-600 p-1"
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

        {/* Refresh Button */}
        <button
          onClick={refreshNow}
          title={`Last synced: ${lastRefreshed.toLocaleTimeString()}`}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
