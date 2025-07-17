import React from 'react';
import { BarChart3, TrendingUp, Wallet, Settings, History, Bot } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'trading', label: 'Trading', icon: TrendingUp },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'strategies', label: 'Strategies', icon: Bot },
    { id: 'history', label: 'History', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col">
      <div className="p-6 border-b border-gray-700">
        <h1 className="text-xl font-bold text-blue-400">AlgoTrade Pro</h1>
        <p className="text-sm text-gray-400 mt-1">Powered by Dhan API</p>
      </div>
      
      <nav className="flex-1 mt-6">
        {menuItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={`w-full flex items-center px-6 py-3 text-left hover:bg-gray-800 transition-colors ${
              activeTab === id ? 'bg-blue-600 border-r-2 border-blue-400' : ''
            }`}
          >
            <Icon className="w-5 h-5 mr-3" />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      
      <div className="p-6 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          <div className="flex justify-between">
            <span>Status:</span>
            <span className="text-green-400">Connected</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>API:</span>
            <span className="text-blue-400">Dhan v2</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;