import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { ApiCredentials } from '../types';
import { dhanAPI } from '../services/dhanAPI';
import { MarketHours } from '../services/marketHours';
import { Key, Shield, Save, User, Mail } from 'lucide-react';

const Settings: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [credentials, setCredentials] = useState<ApiCredentials>({
    apiKey: import.meta.env.VITE_DHAN_ACCESS_TOKEN || '',
    clientId: import.meta.env.VITE_DHAN_CLIENT_ID || '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useEnvCredentials, setUseEnvCredentials] = useState(true);

  const handleConnect = async () => {
    setLoading(true);
    setIsConnected(false);
    try {
      if (!credentials.apiKey || !credentials.clientId) {
        throw new Error('Please enter both Access Token and Client ID');
      }
      
      if (credentials.apiKey.trim().length < 10) {
        throw new Error('Access Token appears to be too short. Please check your token.');
      }
      
      if (!credentials.clientId.match(/^\d+$/)) {
        throw new Error('Client ID should contain only numbers.');
      }
      
      dhanAPI.setCredentials(credentials);
      const success = await dhanAPI.authenticate();
      
      setIsConnected(success);
      if (success) {
        // Store credentials in localStorage for persistence
        localStorage.setItem('dhan_credentials', JSON.stringify(credentials));
      } else {
        throw new Error('Authentication failed. Please verify your credentials and try again.');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnected(false);
      // Clear any stored credentials on failure
      localStorage.removeItem('dhan_credentials');
      
      // Re-throw the error to show the specific message to user
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Load saved credentials on component mount
  React.useEffect(() => {
    // Check if environment credentials are available
    const envToken = import.meta.env.VITE_DHAN_ACCESS_TOKEN;
    const envClientId = import.meta.env.VITE_DHAN_CLIENT_ID;
    
    if (envToken && envClientId) {
      const envCredentials = { apiKey: envToken, clientId: envClientId };
      setCredentials(envCredentials);
      dhanAPI.setCredentials(envCredentials);
      // Auto-test connection with environment credentials
      dhanAPI.authenticate().then(setIsConnected);
    } else {
      // No environment credentials available, enable manual input
      setUseEnvCredentials(false);
      // Fallback to saved credentials
      const savedCredentials = localStorage.getItem('dhan_credentials');
      if (savedCredentials) {
        try {
          const parsed = JSON.parse(savedCredentials);
          setCredentials(parsed);
          dhanAPI.setCredentials(parsed);
          // Auto-test connection
          dhanAPI.authenticate().then(setIsConnected);
        } catch (error) {
          console.error('Error loading saved credentials:', error);
        }
      }
    }
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">Configure your API credentials and trading preferences</p>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">User Profile</h3>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-gray-500 mr-3" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
            {user.name && (
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-500 mr-3" />
                <div>
                  <p className="text-sm text-gray-500">Name</p>
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Key className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
        </div>
        
        <div className="space-y-4">
          {/* Environment Credentials Toggle */}
          {import.meta.env.VITE_DHAN_ACCESS_TOKEN && import.meta.env.VITE_DHAN_CLIENT_ID && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Environment Credentials</h4>
                  <p className="text-sm text-blue-700">Use pre-configured API credentials from environment</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={useEnvCredentials}
                    onChange={(e) => {
                      setUseEnvCredentials(e.target.checked);
                      if (e.target.checked) {
                        setCredentials({
                          apiKey: import.meta.env.VITE_DHAN_ACCESS_TOKEN || '',
                          clientId: import.meta.env.VITE_DHAN_CLIENT_ID || ''
                        });
                      } else {
                        setCredentials({ apiKey: '', clientId: '' });
                      }
                ✅ Successfully connected to Dhan API! 
                <br />
                📊 <strong>DEMO MODE:</strong> Using mock market data (no paid API calls)
                <br />
                💰 Orders will be simulated for testing purposes
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <input
              type="password"
              value={credentials.apiKey}
              onChange={(e) => setCredentials({...credentials, apiKey: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Dhan access token"
              disabled={useEnvCredentials}
            />
            <p className="text-xs text-gray-500 mt-1">
              {useEnvCredentials ? 'Using environment credentials' : 'Get your access token from Dhan API dashboard'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Client ID
            </label>
            <input
              type="text"
              value={credentials.clientId}
              onChange={(e) => setCredentials({...credentials, clientId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your Client ID"
              disabled={useEnvCredentials}
            />
            <p className="text-xs text-gray-500 mt-1">
              {useEnvCredentials ? 'Using environment credentials' : 'Your Dhan client ID (usually starts with 11)'}
            </p>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Shield className={`w-5 h-5 mr-2 ${isConnected ? 'text-green-600' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
                {isConnected ? 'Connected' : 'Not Connected'}
              </span>
            </div>
            <button
              onClick={handleConnect}
              disabled={loading || !credentials.apiKey}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors min-w-[120px] justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {loading ? 'Connecting...' : 'Connect'}
            </button>
          </div>
        </div>
        
        {isConnected && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-700 text-sm flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              ✅ Successfully connected to Dhan API! 
              {MarketHours.isMarketOpen() 
                ? ' Live data is now available.' 
                : ' Live data will be available during market hours (9:15 AM - 3:30 PM IST).'}
            </p>
          </div>
        )}
        
        {!isConnected && credentials.apiKey && credentials.clientId && !loading && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700 text-sm">
              ❌ Connection failed. Please verify your credentials and try again.
            </p>
          </div>
        )}
        
        {!MarketHours.isMarketOpen() && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700 text-sm">
              📅 Market Status: {MarketHours.getMarketStatus()}
              <br />
              Next market open: {MarketHours.getNextMarketOpen().toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Preferences</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Auto-execute strategies</label>
              <p className="text-sm text-gray-500">Automatically execute trades based on strategy signals</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Risk management</label>
              <p className="text-sm text-gray-500">Enable automatic stop-loss and position sizing</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max position size (% of portfolio)
            </label>
            <input
              type="number"
              defaultValue={10}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stop loss percentage
            </label>
            <input
              type="number"
              defaultValue={5}
              min="0.1"
              max="50"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;