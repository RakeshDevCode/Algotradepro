import React, { useState, useEffect } from 'react';
import { Order, OrderBook } from '../types';
import { dhanAPI } from '../services/dhanAPI';
import { TrendingUp, TrendingDown, Clock, CheckCircle, XCircle } from 'lucide-react';
import OrderForm from './OrderForm';

interface TradingInterfaceProps {
  onOrderPlaced: (order: Order) => void;
}

const TradingInterface: React.FC<TradingInterfaceProps> = ({ onOrderPlaced }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('RELIANCE');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Only fetch orders, not continuously
        try {
          const ordersData = await dhanAPI.getOrders();
          setOrders(ordersData);
        } catch (orderError) {
          console.warn('Failed to fetch orders:', orderError);
          setOrders([]);
        }
        
      } catch (error) {
        console.warn('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchOrderBook = async () => {
    try {
      const orderBookData = await dhanAPI.getOrderBook(selectedSymbol);
      setOrderBook(orderBookData);
    } catch (error) {
      console.warn('Failed to fetch order book:', error);
    }
  };

  const handleOrderPlaced = (order: Order) => {
    setOrders([order, ...orders]);
    onOrderPlaced(order);
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'FILLED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'FILLED':
        return 'text-green-600 bg-green-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-yellow-600 bg-yellow-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Form */}
        <div>
          <OrderForm onOrderPlaced={handleOrderPlaced} />
        </div>

        {/* Order Book */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Order Book</h3>
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="RELIANCE">RELIANCE</option>
              <option value="TCS">TCS</option>
              <option value="INFY">INFY</option>
              <option value="HDFC">HDFC</option>
            </select>
          </div>
          
          {orderBook && (
            <div className="space-y-4">
              {/* Asks (Sell Orders) */}
              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2">Asks (Sell)</h4>
                <div className="space-y-1">
                  {orderBook.asks.slice().reverse().map((ask, index) => (
                    <div key={index} className="flex justify-between text-sm bg-red-50 p-2 rounded">
                      <span className="text-red-600 font-medium">₹{ask.price.toFixed(2)}</span>
                      <span className="text-gray-600">{ask.quantity}</span>
                      <span className="text-gray-500">{ask.orders}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Spread */}
              <div className="border-t border-b border-gray-200 py-2 text-center">
                <span className="text-sm text-gray-500">
                  Spread: ₹{(orderBook.asks[0].price - orderBook.bids[0].price).toFixed(2)}
                </span>
              </div>

              {/* Bids (Buy Orders) */}
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2">Bids (Buy)</h4>
                <div className="space-y-1">
                  {orderBook.bids.map((bid, index) => (
                    <div key={index} className="flex justify-between text-sm bg-green-50 p-2 rounded">
                      <span className="text-green-600 font-medium">₹{bid.price.toFixed(2)}</span>
                      <span className="text-gray-600">{bid.quantity}</span>
                      <span className="text-gray-500">{bid.orders}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Trading Stats</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Orders</span>
              <span className="font-medium">{orders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Filled Orders</span>
              <span className="font-medium text-green-600">
                {orders.filter(o => o.status === 'FILLED').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Orders</span>
              <span className="font-medium text-yellow-600">
                {orders.filter(o => o.status === 'PENDING').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Cancelled Orders</span>
              <span className="font-medium text-red-600">
                {orders.filter(o => o.status === 'CANCELLED').length}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Orders History */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
          <p className="text-sm text-gray-600">Track all your trading orders and their status</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Side</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.symbol}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center text-sm font-medium ${
                      order.side === 'BUY' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {order.side === 'BUY' ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      {order.side}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ₹{order.price.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.timestamp.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TradingInterface;