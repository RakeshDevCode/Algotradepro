import React, { useEffect, useState } from 'react';
import { Stock } from '../types';
import { dhanAPI } from '../services/dhanAPI';
import { MarketHours } from '../services/marketHours';
import { TrendingUp, TrendingDown } from 'lucide-react';

const MarketData: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const data = await dhanAPI.getMarketData(false);
        setStocks(data);
        setLastRefresh(new Date());
      } catch (error) {
        console.error('Error fetching market data:', error);
      } finally {
        setLoading(false);
      } 
    };

    fetchMarketData();
  }, []);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const data = await dhanAPI.getMarketData(true);
      setStocks(data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error refreshing market data:', error);
    } finally {
      setLoading(false);
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
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Market Data</h2>
            <p className="text-sm text-gray-600">
              Nifty 50 Top 10 Stocks - Last updated: {lastRefresh.toLocaleTimeString()}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={handleRefresh}
              className="mb-2 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            >
              Refresh Prices
            </button>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              MarketHours.isMarketOpen() 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                MarketHours.isMarketOpen() ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              {MarketHours.getMarketStatus()}
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Symbol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">High/Low</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stocks.map((stock) => (
              <tr key={stock.symbol} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                    <div className="text-sm text-gray-500">{stock.name}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">₹{stock.price.toFixed(2)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center text-sm font-medium ${
                    stock.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {stock.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 mr-1" />
                    )}
                    ₹{Math.abs(stock.change).toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {stock.volume.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>H: ₹{stock.high.toFixed(2)}</div>
                  <div>L: ₹{stock.low.toFixed(2)}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketData;