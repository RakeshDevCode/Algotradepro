import React, { useState, useEffect } from 'react';
import TopNavigation from './components/TopNavigation';
import HomePage from './components/HomePage';
import AuthModal from './components/AuthModal';
import Dashboard from './components/Dashboard';
import Portfolio from './components/Portfolio';
import StrategyManager from './components/StrategyManager';
import TradingInterface from './components/TradingInterface';
import WatchlistManager from './components/WatchlistManager';
import Settings from './components/Settings';
import { authService, User } from './services/authService';
import { Order } from './types';

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setUser(user);
      if (user && activeTab === 'home') {
        setActiveTab('dashboard');
      }
    });

    return unsubscribe;
  }, [activeTab]);

  const handleOrderPlaced = (order: Order) => {
    setOrders([...orders, order]);
  };

  const handleGetStarted = () => {
    if (user) {
      setActiveTab('dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleShowAuth = () => {
    setShowAuthModal(true);
  };

  const handleLogin = async (email: string, password: string) => {
    await authService.login(email, password);
    setShowAuthModal(false);
  };

  const handleSignup = async (email: string, password: string, name: string) => {
    await authService.signup(email, password, name);
    setShowAuthModal(false);
  };

  const handleLogout = async () => {
    await authService.logout();
    setActiveTab('home');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage onGetStarted={handleGetStarted} onShowAuth={handleShowAuth} />;
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
      <TopNavigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        user={user}
        onShowAuth={handleShowAuth}
        onLogout={handleLogout}
      />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onLogin={handleLogin}
        onSignup={handleSignup}
      />
      
      <div className="flex-1">
        {activeTab !== 'home' && user && (
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
        <main className={activeTab !== 'home' && user ? 'p-6 max-w-7xl mx-auto' : ''}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

export default App;