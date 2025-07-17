import React from 'react';
import MarketData from './MarketData';
import OrderForm from './OrderForm';
import { Order } from '../types';
import { TrendingUp, TrendingDown, Activity, DollarSign } from 'lucide-react';

interface DashboardProps {
  onOrderPlaced: (order: Order) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOrderPlaced }) => {
  const stats = [
    {
      title: 'Portfolio Value',
      value: '₹2,45,678',
      change: '+5.67%',
      positive: true,
      icon: DollarSign
    },
    {
      title: 'Today\'s P&L',
      value: '₹3,245',
      change: '+1.23%',
      positive: true,
      icon: TrendingUp
    },
    {
      title: 'Active Orders',
      value: '8',
      change: '2 filled',
      positive: true,
      icon: Activity
    },
    {
      title: 'Active Strategies',
      value: '3',
      change: '2 profitable',
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