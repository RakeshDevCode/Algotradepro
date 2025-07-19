import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  Wallet,
  Settings,
  History,
  Bot,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/orders', label: 'Orders', icon: TrendingUp },
  { to: '/portfolio', label: 'Portfolio', icon: Wallet },
  { to: '/strategy', label: 'Strategy', icon: Bot },
  { to: '/history', label: 'History', icon: History },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/apikey', label: 'API Key', icon: KeyRound },
];

// Function to safely apply classes based on NavLink active state
const getLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-800 transition ${
    isActive ? 'bg-blue-600 font-semibold' : ''
  }`;

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen }) => {
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 bg-black opacity-50 z-20 md:hidden ${
          sidebarOpen ? 'block' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <nav
        className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white shadow transform z-30 transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:static`}
      >
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold text-blue-400">AlgoTrade Pro</h1>
          <p className="text-sm text-gray-400 mt-1">Powered by @rakeshdevcode</p>
        </div>

        {/* Navigation Links */}
        <ul className="p-4 flex-1 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to} className="mb-2">
              <NavLink
                to={to}
                className={getLinkClass}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Footer Status */}
        <div className="p-6 border-t border-gray-700 text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="text-green-400">Connected</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>API:</span>
            <span className="text-blue-400">Dhan v2</span>
           
          </div>

        </div>
      </nav>
    </>
  );
};

export default Sidebar;
