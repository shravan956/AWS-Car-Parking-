import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Grid3X3,
  Radio,
  FileText,
  BarChart3,
  Settings,
  Car,
  Cloud,
  Layers,
  Activity,
} from 'lucide-react';
import { useParking } from '../../context/ParkingContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { stats, isSimulating } = useParking();

  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: LayoutDashboard,
      badge: `${stats.occupancyRate}%`,
    },
    {
      to: '/live-parking',
      label: 'Live Parking',
      icon: Grid3X3,
      badge: `${stats.availableSlots} Free`,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      to: '/iot-devices',
      label: 'IoT Devices',
      icon: Radio,
      badge: `${stats.sensorsOnline}/30`,
    },
    {
      to: '/activity-logs',
      label: 'Activity Logs',
      icon: FileText,
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between h-full border-r border-slate-800 select-none">
      <div>
        {/* Logo and Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-brand-700 to-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Car className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-base tracking-tight">SmartPark</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Cloud
                </span>
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Cloud className="w-3 h-3 text-blue-400" />
                <span>AWS IoT Console</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Facility Summary Card */}
        <div className="p-3 mx-3 my-3 bg-slate-800/70 rounded-lg border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
              Facility Status
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-400 ${isSimulating ? 'animate-ping-subtle' : ''}`} />
              {isSimulating ? 'Live Telemetry' : 'Paused'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-white font-bold text-sm">30 Multi-Level Bays</span>
            <span className="text-slate-400 text-[11px]">3 Floors</span>
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-slate-700 rounded-full h-1.5 mt-2 overflow-hidden flex">
            <div
              className="bg-rose-500 h-full transition-all duration-300"
              style={{ width: `${stats.occupancyRate}%` }}
              title={`Occupied: ${stats.occupiedSlots}`}
            />
            <div
              className="bg-amber-400 h-full transition-all duration-300"
              style={{ width: `${(stats.reservedSlots / stats.totalSlots) * 100}%` }}
              title={`Reserved: ${stats.reservedSlots}`}
            />
            <div
              className="bg-emerald-500 h-full transition-all duration-300"
              style={{ width: `${(stats.availableSlots / stats.totalSlots) * 100}%` }}
              title={`Available: ${stats.availableSlots}`}
            />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold transition-colors ${
                    item.badgeColor || 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-2">
        <div className="flex items-center justify-between">
          <span>Engine Mode</span>
          <span className="font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 text-[10px]">
            DEMO SIMULATOR
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>MQTT Broker</span>
          <span className="text-slate-400 font-mono text-[10px]">AWS IoT Core</span>
        </div>
        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
          SmartPark Cloud v2.5.0
        </div>
      </div>
    </aside>
  );
};
