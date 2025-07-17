import React, { useState } from 'react';
import TopNavigation from './components/TopNavigation';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import StrategyManager from './components/StrategyManager';
import TradingInterface from './components/TradingInterface';
import WatchlistManager from './components/WatchlistManager';
import Settings from './components/Settings';
import { Order } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [orders, setOrders] = useState<Order[]>([]);

  const handleOrderPlaced = (order: Order) => {
    setOrders([...orders, order]);
  };

  const handleGetStarted = () => {
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onGetStarted={handleGetStarted} />;
      case 'dashboard':
        return <Dashboard onOrderPlaced={handleOrderPlaced} />;
      case 'trading':
        return <TradingInterface onOrderPlaced={handleOrderPlaced} />;
      case 'portfolio':
        return <Portfolio />;
      case 'watchlist':
        return <WatchlistManager />;
      case 'strategies':
        return <StrategyManager />;
      case 'settings':
        return <Settings />;
      default:
        return <HomePage onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1">
        {activeTab !== 'home' && (
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold text-gray-900">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-600">Live Market Data</span>
                  </div>
                </div>
              </div>
            </div>
          </header>
        )}
        <main className={activeTab !== 'home' ? 'p-6 max-w-7xl mx-auto' : ''}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;