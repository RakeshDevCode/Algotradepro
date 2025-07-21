import React, { useState, useEffect } from 'react';
import MarketData from './MarketData';
import OrderForm from './OrderForm';
import { Order, Position } from '../types';
import { dhanAPI } from '../services/dhanAPI';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface DashboardProps {
  onOrderPlaced: (order: Order) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOrderPlaced }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [positionsData, ordersData] = await Promise.all([
          dhanAPI.getPositions(),
          dhanAPI.getOrders()
        ]);
        setPositions(positionsData);
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalValue = positions.reduce((sum, pos) => sum + (pos.quantity * pos.avgPrice), 0);
  const todayOrders = orders.filter(order => {
    const today = new Date();
    const orderDate = new Date(order.timestamp);
    return orderDate.toDateString() === today.toDateString();
  });

  const stats = [
    {
      title: 'Portfolio Value',
      value: `₹${totalValue.toLocaleString()}`,
      change: totalValue > 0 ? `${positions.length} positions` : 'No positions',
      positive: totalValue >= 0,
      icon: DollarSign
    },
    {
      title: 'Today\'s P&L',
      value: `₹${Math.abs(totalPnL).toLocaleString()}`,
      change: `${totalPnL >= 0 ? '+' : '-'}${((totalPnL / (totalValue || 1)) * 100).toFixed(2)}%`,
      positive: totalPnL >= 0,
      icon: totalPnL >= 0 ? TrendingUp : TrendingDown
    },
    {
      title: 'Today\'s Orders',
      value: todayOrders.length.toString(),
      change: `${todayOrders.filter(o => o.status === 'FILLED').length} filled`,
      positive: true,
      icon: Activity
    },
    {
      title: 'Active Positions',
      value: positions.length.toString(),
      change: `${positions.filter(p => p.pnl > 0).length} profitable`,
      positive: true,
      icon: TrendingUp
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-600 mt-2">Real-time overview of your trading activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className={`flex items-center mt-1 text-sm ${
                  stat.positive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.positive ? (
                    <TrendingUp className="w-4 h-4 mr-1" />
                  ) : (
                    <TrendingDown className="w-4 h-4 mr-1" />
                  )}
                  {stat.change}
                </div>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <stat.icon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Intraday Positions */}
      {positions.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Today's Positions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">P&L</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {positions.slice(0, 5).map((position, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{position.symbol}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{position.quantity}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">₹{position.avgPrice.toFixed(2)}</td>
                    <td className={`px-6 py-4 text-sm font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₹{Math.abs(position.pnl).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MarketData />
        </div>
        <div>
          <OrderForm onOrderPlaced={onOrderPlaced} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;