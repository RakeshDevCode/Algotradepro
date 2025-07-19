import React, { useState } from 'react';
import { ApiCredentials } from '../types';
import { dhanAPI } from '../services/dhanAPI';
import { Key, Shield, Save } from 'lucide-react';

const Settings: React.FC = () => {
  const [credentials, setCredentials] = useState<ApiCredentials>({
    apiKey: '',
    clientId: '',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      dhanAPI.setCredentials(credentials);
      const success = await dhanAPI.authenticate();
      setIsConnected(success);
      if (success) {
        // Store credentials in localStorage for persistence
        localStorage.setItem('dhan_credentials', JSON.stringify(credentials));
      }
    } catch (error) {
      console.error('Connection failed:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  // Load saved credentials on component mount
  React.useEffect(() => {
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
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-gray-600 mt-2">Configure your API credentials and trading preferences</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center mb-4">
          <Key className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">API Configuration</h3>
        </div>
        
        <div className="space-y-4">
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
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your access token from Dhan API dashboard
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
            />
            <p className="text-xs text-gray-500 mt-1">
              Your Dhan client ID (usually starts with 11)
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
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
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
            <p className="text-green-700 text-sm">
              ✅ Successfully connected to Dhan API! You can now place orders and fetch live data.
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