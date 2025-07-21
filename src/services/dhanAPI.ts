import { Stock, Order, Position, ApiCredentials, OrderBook, WatchlistItem } from '../types';
import { csvParserService } from './csvParser';
import { webSocketService, TickerData } from './websocketService';
import { MarketHours } from './marketHours';

class DhanAPIService {
  private baseURL = '/api';
  private credentials: ApiCredentials | null = null;
  private orderStatusCallbacks: Map<string, (status: string, message: string) => void> = new Map();
  
  // Cache for market data and security info
  private marketDataCache: Map<string, Stock> = new Map();
  private securityDataCache: Map<string, any> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 30 * 1000; // 30 seconds for live data

  // Popular stocks for initial display
  private readonly POPULAR_STOCKS = [
    { symbol: 'RELIANCE', securityId: '2885', name: 'Reliance Industries' },
    { symbol: 'TCS', securityId: '11536', name: 'Tata Consultancy Services' },
    { symbol: 'HDFCBANK', securityId: '1333', name: 'HDFC Bank' },
    { symbol: 'INFY', securityId: '1594', name: 'Infosys' },
    { symbol: 'ICICIBANK', securityId: '4963', name: 'ICICI Bank' },
    { symbol: 'BHARTIARTL', securityId: '317', name: 'Bharti Airtel' },
    { symbol: 'ITC', securityId: '1660', name: 'ITC' },
    { symbol: 'SBIN', securityId: '3045', name: 'State Bank of India' },
    { symbol: 'LT', securityId: '1922', name: 'Larsen & Toubro' },
    { symbol: 'KOTAKBANK', securityId: '1808', name: 'Kotak Mahindra Bank' }
  ];

  constructor() {
    this.loadSecurityData();
  }

  private async loadSecurityData() {
    try {
      // Load CSV data for symbol mapping
      const response = await fetch('/src/assets/api-scrip-master.csv');
      if (response.ok) {
        const csvContent = await response.text();
        await csvParserService.loadSecurityData(csvContent);
        console.log('Security data loaded successfully');
      } else {
        console.warn('Could not load security data CSV');
      }
    } catch (error) {
      console.warn('Error loading security data:', error);
    }
  }

  setCredentials(credentials: ApiCredentials) {
    this.credentials = credentials;
    
    // Initialize WebSocket connection for live data during market hours
    if (credentials.apiKey && credentials.clientId && MarketHours.isMarketOpen()) {
      webSocketService.setCredentials(credentials.apiKey, credentials.clientId);
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    if (!this.credentials?.apiKey || !this.credentials?.clientId) {
      throw new Error('API credentials not configured');
    }
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'access-token': this.credentials.apiKey,
      'client-id': this.credentials.clientId,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorData.remarks || errorMessage;
        } else {
          const errorText = await response.text();
          if (errorText) {
            errorMessage = errorText;
          }
        }
      } catch (parseError) {
        // Use default error message if parsing fails
      }
      
      throw new Error(errorMessage);
    }

    // Parse JSON response
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      return response.text();
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        console.error('Missing credentials for authentication');
        return false;
      }
      
      // Validate credential format
      if (this.credentials.apiKey.length < 10) {
        throw new Error('Access token appears to be invalid (too short)');
      }
      
      if (!this.credentials.clientId.match(/^\d+$/)) {
        throw new Error('Client ID must contain only numbers');
      }
      
      // Test authentication with fund limit API (FREE endpoint)
      const response = await this.makeRequest('/fundlimit');
      
      // Check if response contains expected fields
      if (response && (
        response.dhanClientId || 
        response.availabelBalance !== undefined || 
        response.availableBalance !== undefined ||
        response.status === 'success' ||
        response.data
      )) {
        console.log('Authentication successful - Using mock data for market prices');
        return true;
      } else {
        console.error('Authentication failed - invalid response format:', response);
        throw new Error('Authentication failed - unexpected response format');
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('CORS') || error.message.includes('cors')) {
          throw new Error('Access token has expired or is invalid. Please generate a new token from Dhan API dashboard.');
        } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
          throw new Error('Invalid credentials. Please check your Access Token and Client ID.');
        } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
          throw new Error('Access denied. Please ensure your API key has the required permissions.');
        } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
          throw new Error('Network error. Please check your internet connection and try again.');
        }
      }
      
      return false;
    }
  }

  async getMarketData(forceRefresh: boolean = false): Promise<Stock[]> {
    try {
      // Using mock data only - no paid API calls
      const fallbackData = this.generateMockData();
      fallbackData.forEach(stock => {
        this.marketDataCache.set(stock.symbol, stock);
      });
      
      return fallbackData;

    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.generateMockData();
    }
  }

  private generateMockData(): Stock[] {
    return this.POPULAR_STOCKS.map((stock) => {
      const basePrice = 1000 + Math.random() * 2000;
      const change = (Math.random() - 0.5) * 100;
      const changePercent = (change / basePrice) * 100;
      
      return {
        symbol: stock.symbol,
        name: stock.name,
        price: basePrice,
        change: change,
        changePercent: changePercent,
        volume: Math.floor(Math.random() * 1000000),
        high: basePrice + Math.random() * 50,
        low: basePrice - Math.random() * 50,
        open: basePrice + (Math.random() - 0.5) * 20
      };
    });
  }

  async getLivePrice(symbol: string): Promise<Stock | null> {
    try {
      // Using mock data only - no paid API calls
      const mockStock = this.generateMockData().find(s => s.symbol === symbol);
      if (mockStock) {
        this.marketDataCache.set(symbol, mockStock);
        return mockStock;
      }

      return null;
    } catch (error) {
      console.error('Error fetching live price:', error);
      return null;
    }
  }

  async searchSymbols(query: string): Promise<WatchlistItem[]> {
    try {
      if (!query || query.length < 1) {
        return [];
      }

      // First search in CSV data
      const csvResults = csvParserService.searchSecurities(query, 10);
      if (csvResults.length > 0) {
        const results = await Promise.all(csvResults.map(async (security) => {
          const livePrice = await this.getLivePrice(security.tradingSymbol);
          return {
            symbol: security.tradingSymbol,
            name: security.customSymbol,
            price: livePrice?.price || 0,
            change: livePrice?.change || 0,
            changePercent: livePrice?.changePercent || 0
          };
        }));
        return results;
      }

      // Fallback to popular stocks search
      const queryLower = query.toLowerCase();
      const matchingStocks = this.POPULAR_STOCKS.filter(stock => 
        stock.symbol.toLowerCase().includes(queryLower) ||
        stock.name.toLowerCase().includes(queryLower)
      );

      const results = await Promise.all(matchingStocks.map(async (stock) => {
        const livePrice = await this.getLivePrice(stock.symbol);
        return {
          symbol: stock.symbol,
          name: stock.name,
          price: livePrice?.price || 0,
          change: livePrice?.change || 0,
          changePercent: livePrice?.changePercent || 0
        };
      }));

      return results;
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  async placeOrder(order: Omit<Order, 'id' | 'timestamp' | 'status'>): Promise<Order> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        throw new Error('API credentials not configured');
      }

      // DEMO MODE: Create mock order without calling paid API
      console.log('DEMO MODE: Order would be placed with:', order);

      const newOrder: Order = {
        ...order,
        id: `DEMO_${Date.now()}`,
        timestamp: new Date(),
        status: 'FILLED' // Mock as filled for demo
      };

      // Notify about order placement
      const callback = this.orderStatusCallbacks.get(newOrder.id);
      if (callback) {
        callback('PLACED', `DEMO: Order placed successfully for ${order.symbol}`);
      }

      return newOrder;
    } catch (error) {
      console.error('Error placing order:', error);
      
      // Create a failed order for UI feedback
      const failedOrder: Order = {
        ...order,
        id: Date.now().toString(),
        timestamp: new Date(),
        status: 'CANCELLED'
      };
      
      throw error;
    }
  }

  onOrderStatus(orderId: string, callback: (status: string, message: string) => void) {
    this.orderStatusCallbacks.set(orderId, callback);
  }

  async getOrders(): Promise<Order[]> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        console.warn('API credentials not configured');
        return [];
      }

      const response = await this.makeRequest('/orders');
      
      if (Array.isArray(response)) {
        return response.map((order: any) => ({
          id: order.orderId || order.id || Date.now().toString(),
          symbol: order.tradingSymbol || order.symbol || 'UNKNOWN',
          side: order.transactionType === 'BUY' ? 'BUY' : 'SELL',
          quantity: order.quantity || 0,
          price: order.price || 0,
          type: order.orderType === 'LIMIT' ? 'LIMIT' : 'MARKET',
          status: this.mapOrderStatus(order.orderStatus),
          timestamp: new Date(order.createTime || Date.now())
        }));
      }
      
      console.warn('Orders API returned unexpected format:', response);
      return [];
    } catch (error) {
      console.warn('Orders API unavailable:', error);
      return [];
    }
  }

  private mapOrderStatus(status: string): Order['status'] {
    switch (status?.toUpperCase()) {
      case 'TRADED':
      case 'COMPLETE':
      case 'FILLED':
        return 'FILLED';
      case 'CANCELLED':
      case 'REJECTED':
        return 'CANCELLED';
      case 'PENDING':
      case 'TRANSIT':
      default:
        return 'PENDING';
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        return [];
      }

      const response = await this.makeRequest('/positions');
      
      if (Array.isArray(response)) {
        return response.map((position: any) => ({
          symbol: position.tradingSymbol || position.symbol,
          quantity: position.netQty || 0,
          avgPrice: position.buyAvg || position.avgPrice || 0,
          currentPrice: position.ltp || position.buyAvg || 0,
          pnl: position.unrealizedProfit || 0,
          pnlPercent: position.buyAvg ? ((position.unrealizedProfit || 0) / (position.buyAvg * Math.abs(position.netQty || 1))) * 100 : 0
        }));
      }
      return [];
    } catch (error) {
      console.warn('Positions API unavailable:', error);
      return [];
    }
  }

  async getHoldings(): Promise<Position[]> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        return [];
      }

      const response = await this.makeRequest('/holdings');
      
      if (Array.isArray(response)) {
        return response.map((holding: any) => ({
          symbol: holding.tradingSymbol || holding.symbol,
          quantity: holding.totalQty || 0,
          avgPrice: holding.avgCostPrice || 0,
          currentPrice: holding.ltp || holding.avgCostPrice || 0,
          pnl: holding.unrealizedProfit || 0,
          pnlPercent: holding.avgCostPrice ? ((holding.unrealizedProfit || 0) / (holding.avgCostPrice * holding.totalQty)) * 100 : 0
        }));
      }
      return [];
    } catch (error) {
      console.warn('Holdings API unavailable:', error);
      return [];
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        throw new Error('API credentials not configured');
      }

      const response = await this.makeRequest(`/orders/${orderId}`, {
        method: 'DELETE'
      });

      return response?.orderStatus === 'CANCELLED';
    } catch (error) {
      console.error('Error cancelling order:', error);
      throw error;
    }
  }

  async getOrderBook(symbol: string): Promise<OrderBook> {
    // Mock order book for now - can be enhanced with real market depth API
    const currentPrice = this.marketDataCache.get(symbol)?.price || 1000;
    const spread = currentPrice * 0.001; // 0.1% spread
    
    return {
      symbol,
      bids: Array.from({ length: 5 }, (_, i) => ({
        price: currentPrice - spread * (i + 1),
        quantity: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 20) + 1
      })),
      asks: Array.from({ length: 5 }, (_, i) => ({
        price: currentPrice + spread * (i + 1),
        quantity: Math.floor(Math.random() * 500) + 100,
        orders: Math.floor(Math.random() * 20) + 1
      })),
      lastUpdated: new Date()
    };
  }

  disconnect() {
    webSocketService.disconnect();
    this.marketDataCache.clear();
    this.orderStatusCallbacks.clear();
  }
}

export const dhanAPI = new DhanAPIService();