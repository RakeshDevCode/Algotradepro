import React from 'react';
import { BarChart3, TrendingUp, Wallet, Settings, History, Bot } from 'lucide-react';

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ activeTab, onTabChange }) => {
  const menuItems = [
    { id: 'home', label: 'Home', icon: BarChart3 },
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'trading', label: 'Trading & Orders', icon: TrendingUp },
    { id: 'portfolio', label: 'Portfolio', icon: Wallet },
    { id: 'watchlist', label: 'Watchlist', icon: History },
    { id: 'strategies', label: 'Strategies', icon: Bot },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="bg-gray-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-blue-400">AlgoTrade Pro</h1>
              <p className="text-xs text-gray-400">Powered by Dhan API</p>
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {menuItems.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => onTabChange(id)}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                </button>
              ))}
            </div>
          </div>
          
          <div className="hidden md:block">
            <div className="text-sm text-gray-400">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span>Connected</span>
                </div>
                <div>{new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNavigation;