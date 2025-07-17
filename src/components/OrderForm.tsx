import React, { useState } from 'react';
import { Order } from '../types';
import { dhanAPI } from '../services/dhanAPI';
import { Bug as Buy, Bell as Sell } from 'lucide-react';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const order = await dhanAPI.placeOrder({
        symbol: symbol.toUpperCase(),
        side,
        quantity: parseInt(quantity),
        price: parseFloat(price),
        type,
      });
      
      onOrderPlaced(order);
      
      // Reset form
      setSymbol('');
      setQuantity('');
      setPrice('');
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Place Order</h2>
      
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
            <Buy className="w-4 h-4 mr-2" />
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
            <Sell className="w-4 h-4 mr-2" />
            Sell
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="e.g., RELIANCE"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
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