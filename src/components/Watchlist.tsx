import React, { useState, useEffect } from 'react';
import { Watchlist, WatchlistItem } from '../types';
import { dhanAPI } from '../services/dhanAPI';
import { csvParserService } from '../services/csvParser';
import { Plus, Search, Star, TrendingUp, TrendingDown, X, Trash2, ShoppingCart } from 'lucide-react';

const WatchlistComponent: React.FC = () => {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([
    {
      id: '1',
      name: 'My Favorites',
      items: [],
      createdAt: new Date()
    }
  ]);
  
  const [activeWatchlist, setActiveWatchlist] = useState('1');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.length >= 1) {
      const searchStocks = async () => {
        setLoading(true);
        try {
          const results = await dhanAPI.searchSymbols(searchQuery);
          setSearchResults(results);
        } catch (error) {
          console.error('Error searching stocks:', error);
          setSearchResults([]);
        } finally {
          setLoading(false);
        }
      };
      
      const debounceTimer = setTimeout(searchStocks, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const createWatchlist = () => {
    if (newWatchlistName.trim() && watchlists.length < 10) {
      const newWatchlist: Watchlist = {
        id: Date.now().toString(),
        name: newWatchlistName.trim(),
        items: [],
        createdAt: new Date()
      };
      setWatchlists([...watchlists, newWatchlist]);
      setNewWatchlistName('');
      setShowCreateForm(false);
      setActiveWatchlist(newWatchlist.id);
    }
  };

  const deleteWatchlist = (id: string) => {
    if (watchlists.length > 1) {
      const updatedWatchlists = watchlists.filter(w => w.id !== id);
      setWatchlists(updatedWatchlists);
      if (activeWatchlist === id) {
        setActiveWatchlist(updatedWatchlists[0].id);
      }
    }
  };

  const addToWatchlist = (stock: WatchlistItem) => {
    const watchlist = watchlists.find(w => w.id === activeWatchlist);
    if (watchlist && !watchlist.items.some(item => item.symbol === stock.symbol)) {
      const updatedWatchlists = watchlists.map(w =>
        w.id === activeWatchlist
          ? { ...w, items: [...w.items, stock] }
          : w
      );
      setWatchlists(updatedWatchlists);
      setSearchQuery('');
      setSearchResults([]);
      setShowAddStock(false);
    }
  };

  const removeFromWatchlist = (symbol: string) => {
    const updatedWatchlists = watchlists.map(w =>
      w.id === activeWatchlist
        ? { ...w, items: w.items.filter(item => item.symbol !== symbol) }
        : w
    );
    setWatchlists(updatedWatchlists);
  };

  const buyFromWatchlist = (symbol: string) => {
    // Navigate to order form with pre-filled symbol
    const event = new CustomEvent('openOrderForm', { detail: { symbol, side: 'BUY' } });
    window.dispatchEvent(event);
  };

  const currentWatchlist = watchlists.find(w => w.id === activeWatchlist);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Watchlists</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAddStock(!showAddStock)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            disabled={!currentWatchlist}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Stock
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            disabled={watchlists.length >= 10}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Watchlist
          </button>
        </div>
      </div>

      {/* Watchlist Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 overflow-x-auto">
        {watchlists.map((watchlist) => (
          <button
            key={watchlist.id}
            onClick={() => setActiveWatchlist(watchlist.id)}
            className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
              activeWatchlist === watchlist.id
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Star className="w-4 h-4 mr-2" />
            {watchlist.name}
            <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
              {watchlist.items.length}
            </span>
            {watchlists.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteWatchlist(watchlist.id);
                }}
                className="ml-2 text-gray-400 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </button>
        ))}
      </div>

      {/* Create Watchlist Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Watchlist</h3>
          <div className="flex space-x-3">
            <input
              type="text"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder="Watchlist name"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={30}
            />
            <button
              onClick={createWatchlist}
              disabled={!newWatchlistName.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            You can create up to 10 watchlists. Currently: {watchlists.length}/10
          </p>
        </div>
      )}

      {/* Add Stock Form */}
      {showAddStock && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Stock to {currentWatchlist?.name}</h3>
          <div className="relative">
            <div className="flex items-center">
              <Search className="w-5 h-5 text-gray-400 absolute left-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks by symbol or name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((stock) => (
                  <button
                    key={stock.symbol}
                    onClick={() => addToWatchlist(stock)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{stock.symbol}</div>
                        <div className="text-sm text-gray-500">{stock.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">₹{stock.price.toFixed(2)}</div>
                        <div className={`text-sm ${stock.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {stock.change >= 0 ? '+' : ''}₹{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddStock(false)}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Watchlist Content */}
      {currentWatchlist && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{currentWatchlist.name}</h3>
                <p className="text-sm text-gray-600">{currentWatchlist.items.length} stocks</p>
              </div>
              <div className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
          
          {currentWatchlist.items.length === 0 ? (
            <div className="p-12 text-center">
              <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks in this watchlist</h3>
              <p className="text-gray-500 mb-4">Add some stocks to start tracking their performance</p>
              <button
                onClick={() => setShowAddStock(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Stock
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Change</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentWatchlist.items.map((item) => (
                    <tr key={item.symbol} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.symbol}</div>
                          <div className="text-sm text-gray-500">{item.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">₹{item.price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`flex items-center text-sm font-medium ${
                          item.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.change >= 0 ? (
                            <TrendingUp className="w-4 h-4 mr-1" />
                          ) : (
                            <TrendingDown className="w-4 h-4 mr-1" />
                          )}
                          {item.change >= 0 ? '+' : ''}₹{item.change.toFixed(2)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          item.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => buyFromWatchlist(item.symbol)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Buy"
                          >
                            <ShoppingCart className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => removeFromWatchlist(item.symbol)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WatchlistComponent;