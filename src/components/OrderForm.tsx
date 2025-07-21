import React, { useState } from 'react';
import { Order } from '../types';
import { dhanAPI } from '../services/dhanAPI';
import { csvParserService, SecurityData } from '../services/csvParser';
import { TrendingUp, TrendingDown, Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface OrderFormProps {
  onOrderPlaced: (order: Order) => void;
}

const OrderForm: React.FC<OrderFormProps> = ({ onOrderPlaced }) => {
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<'MARKET' | 'LIMIT'>('LIMIT');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SecurityData[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [orderStatus, setOrderStatus] = useState<{
    type: 'success' | 'error' | 'info' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleSymbolSearch = (query: string) => {
    setSymbol(query);
    if (query.length > 1) {
      const results = csvParserService.searchSecurities(query, 10);
      setSearchResults(results);
      setShowSearch(true);
    } else {
      setSearchResults([]);
      setShowSearch(false);
    }
  };

  const selectSymbol = (security: SecurityData) => {
    setSymbol(security.tradingSymbol);
    setSearchResults([]);
    setShowSearch(false);
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setOrderStatus({ type: null, message: '' });

    try {
      const order = await dhanAPI.placeOrder({
        symbol: symbol.toUpperCase(),
        side,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        type,
      });
      
      // Set up order status callback
      dhanAPI.onOrderStatus(order.id, (status, message) => {
        if (status === 'PLACED') {
          setOrderStatus({ type: 'success', message });
        } else if (status === 'REJECTED') {
          setOrderStatus({ type: 'error', message });
        }
      });
      
      onOrderPlaced(order);
      setOrderStatus({ 
        type: 'success', 
        message: `${side} order for ${quantity} shares of ${symbol} placed successfully!` 
      });
      
      // Reset form
      setSymbol('');
      setQuantity('');
      setPrice('');
    } catch (error) {
      console.error('Error placing order:', error);
      setOrderStatus({ 
        type: 'error', 
        message: `Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Place Order</h2>
      
      {/* Order Status Message */}
      {orderStatus.type && (
        <div className={`mb-4 p-3 rounded-md flex items-center ${
          orderStatus.type === 'success' ? 'bg-green-50 border border-green-200' :
          orderStatus.type === 'error' ? 'bg-red-50 border border-red-200' :
          'bg-blue-50 border border-blue-200'
        }`}>
          {orderStatus.type === 'success' && <CheckCircle className="w-5 h-5 text-green-600 mr-2" />}
          {orderStatus.type === 'error' && <XCircle className="w-5 h-5 text-red-600 mr-2" />}
          {orderStatus.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 mr-2" />}
          <span className={`text-sm ${
            orderStatus.type === 'success' ? 'text-green-700' :
            orderStatus.type === 'error' ? 'text-red-700' :
            'text-blue-700'
          }`}>
            {orderStatus.message}
          </span>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setSide('BUY')}
            className={`flex items-center justify-center py-3 px-4 rounded-md font-medium transition-colors ${
              side === 'BUY'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy
          </button>
          <button
            type="button"
            onClick={() => setSide('SELL')}
            className={`flex items-center justify-center py-3 px-4 rounded-md font-medium transition-colors ${
              side === 'SELL'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Sell
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symbol
          </label>
          <div className="relative">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={symbol}
                onChange={(e) => handleSymbolSearch(e.target.value)}
                placeholder="Search symbol or company name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            {/* Search Results Dropdown */}
            {showSearch && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((security) => (
                  <button
                    key={security.securityId}
                    type="button"
                    onClick={() => selectSymbol(security)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{security.tradingSymbol}</div>
                        <div className="text-sm text-gray-500">{security.customSymbol}</div>
                      </div>
                      <div className="text-xs text-gray-400">{security.exchangeSegment}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="2450.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required={type === 'LIMIT'}
              disabled={type === 'MARKET'}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'MARKET' | 'LIMIT')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="LIMIT">Limit Order</option>
            <option value="MARKET">Market Order</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : side === 'BUY'
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-red-600 hover:bg-red-700'
          } text-white`}
        >
          {loading ? 'Placing Order...' : `Place ${side} Order`}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;