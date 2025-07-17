import React, { useState } from 'react';
import { Strategy } from '../types';
import { Bot, Play, Pause, Settings } from 'lucide-react';

const StrategyManager: React.FC = () => {
  const [strategies, setStrategies] = useState<Strategy[]>([
    {
      id: '1',
      name: 'Moving Average Crossover',
      description: 'Buy when 20-day MA crosses above 50-day MA',
      status: 'ACTIVE',
      symbol: 'RELIANCE',
      parameters: { shortMA: 20, longMA: 50 },
      pnl: 2350.00,
      trades: 15
    },
    {
      id: '2',
      name: 'RSI Reversal',
      description: 'Buy when RSI < 30, Sell when RSI > 70',
      status: 'INACTIVE',
      symbol: 'TCS',
      parameters: { rsiPeriod: 14, oversold: 30, overbought: 70 },
      pnl: -450.00,
      trades: 8
    },
    {
      id: '3',
      name: 'Bollinger Band Squeeze',
      description: 'Trade on volatility breakouts',
      status: 'ACTIVE',
      symbol: 'INFY',
      parameters: { period: 20, stdDev: 2 },
      pnl: 1250.00,
      trades: 12
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStrategy, setNewStrategy] = useState({
    name: '',
    description: '',
    symbol: '',
    type: 'moving_average'
  });

  const toggleStrategy = (id: string) => {
    setStrategies(strategies.map(strategy => 
      strategy.id === id 
        ? { ...strategy, status: strategy.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
        : strategy
    ));
  };

  const createStrategy = () => {
    const strategy: Strategy = {
      id: Date.now().toString(),
      name: newStrategy.name,
      description: newStrategy.description,
      status: 'INACTIVE',
      symbol: newStrategy.symbol.toUpperCase(),
      parameters: {},
      pnl: 0,
      trades: 0
    };
    
    setStrategies([...strategies, strategy]);
    setNewStrategy({ name: '', description: '', symbol: '', type: 'moving_average' });
    setShowCreateForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Algorithm Strategies</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create Strategy
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Strategy</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Strategy Name
              </label>
              <input
                type="text"
                value={newStrategy.name}
                onChange={(e) => setNewStrategy({...newStrategy, name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Strategy"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Symbol
              </label>
              <input
                type="text"
                value={newStrategy.symbol}
                onChange={(e) => setNewStrategy({...newStrategy, symbol: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="RELIANCE"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={newStrategy.description}
                onChange={(e) => setNewStrategy({...newStrategy, description: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Describe your strategy..."
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={createStrategy}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Create Strategy
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {strategies.map((strategy) => (
          <div key={strategy.id} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center">
                <Bot className="w-8 h-8 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{strategy.name}</h3>
                  <p className="text-sm text-gray-600">{strategy.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleStrategy(strategy.id)}
                  className={`p-2 rounded-md transition-colors ${
                    strategy.status === 'ACTIVE'
                      ? 'bg-red-100 text-red-600 hover:bg-red-200'
                      : 'bg-green-100 text-green-600 hover:bg-green-200'
                  }`}
                >
                  {strategy.status === 'ACTIVE' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Symbol</p>
                <p className="font-medium">{strategy.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  strategy.status === 'ACTIVE'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {strategy.status}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">P&L</p>
                <p className={`font-medium ${
                  strategy.pnl >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ₹{strategy.pnl.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Trades</p>
                <p className="font-medium">{strategy.trades}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrategyManager;