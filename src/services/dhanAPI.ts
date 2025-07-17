import { Stock, Order, Position, ApiCredentials } from '../types';

class DhanAPIService {
  private baseURL = 'https://api.dhan.co/v2';
  private credentials: ApiCredentials | null = null;

  setCredentials(credentials: ApiCredentials) {
    this.credentials = credentials;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.credentials?.accessToken && {
        'Authorization': `Bearer ${this.credentials.accessToken}`
      }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async authenticate(): Promise<boolean> {
    try {
      // Mock authentication - in real implementation, this would use actual Dhan API
      if (this.credentials?.apiKey && this.credentials?.clientId) {
        this.credentials.accessToken = 'mock-access-token';
        return true;
      }
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getMarketData(): Promise<Stock[]> {
    // Mock data for demonstration - replace with actual API call
    return [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd',
        price: 2456.75,
        change: 23.45,
        changePercent: 0.96,
        volume: 1234567,
        high: 2478.90,
        low: 2434.20,
        open: 2445.30
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        price: 3789.20,
        change: -45.60,
        changePercent: -1.19,
        volume: 987654,
        high: 3834.80,
        low: 3765.10,
        open: 3820.50
      },
      {
        symbol: 'INFY',
        name: 'Infosys Limited',
        price: 1456.85,
        change: 15.30,
        changePercent: 1.06,
        volume: 2345678,
        high: 1467.20,
        low: 1441.50,
        open: 1448.75
      },
      {
        symbol: 'HDFC',
        name: 'HDFC Bank Limited',
        price: 1678.45,
        change: -12.85,
        changePercent: -0.76,
        volume: 1567890,
        high: 1692.30,
        low: 1665.20,
        open: 1685.90
      }
    ];
  }

  async placeOrder(order: Omit<Order, 'id' | 'timestamp' | 'status'>): Promise<Order> {
    // Mock order placement
    const newOrder: Order = {
      ...order,
      id: Date.now().toString(),
      timestamp: new Date(),
      status: 'PENDING'
    };
    
    // Simulate order processing
    setTimeout(() => {
      newOrder.status = 'FILLED';
    }, 2000);

    return newOrder;
  }

  async getPositions(): Promise<Position[]> {
    // Mock positions data
    return [
      {
        symbol: 'RELIANCE',
        quantity: 100,
        avgPrice: 2400.00,
        currentPrice: 2456.75,
        pnl: 5675.00,
        pnlPercent: 2.36
      },
      {
        symbol: 'TCS',
        quantity: 50,
        avgPrice: 3800.00,
        currentPrice: 3789.20,
        pnl: -540.00,
        pnlPercent: -0.28
      }
    ];
  }

  async getOrders(): Promise<Order[]> {
    // Mock orders data
    return [
      {
        id: '1',
        symbol: 'RELIANCE',
        side: 'BUY',
        quantity: 100,
        price: 2400.00,
        type: 'LIMIT',
        status: 'FILLED',
        timestamp: new Date(Date.now() - 3600000)
      },
      {
        id: '2',
        symbol: 'TCS',
        side: 'SELL',
        quantity: 25,
        price: 3800.00,
        type: 'LIMIT',
        status: 'PENDING',
        timestamp: new Date()
      }
    ];
  }

  async getOrderBook(symbol: string): Promise<OrderBook> {
    // Mock order book data
    return {
      symbol,
      bids: [
        { price: 2456.50, quantity: 100, orders: 5 },
        { price: 2456.25, quantity: 250, orders: 8 },
        { price: 2456.00, quantity: 150, orders: 3 },
        { price: 2455.75, quantity: 300, orders: 12 },
        { price: 2455.50, quantity: 200, orders: 6 },
      ],
      asks: [
        { price: 2456.75, quantity: 120, orders: 4 },
        { price: 2457.00, quantity: 180, orders: 7 },
        { price: 2457.25, quantity: 220, orders: 9 },
        { price: 2457.50, quantity: 160, orders: 5 },
        { price: 2457.75, quantity: 280, orders: 11 },
      ],
      lastUpdated: new Date()
    };
  }

  async searchSymbols(query: string): Promise<WatchlistItem[]> {
    // Mock search results
    const allSymbols = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', price: 2456.75, change: 23.45, changePercent: 0.96 },
      { symbol: 'TCS', name: 'Tata Consultancy Services', price: 3789.20, change: -45.60, changePercent: -1.19 },
      { symbol: 'INFY', name: 'Infosys Limited', price: 1456.85, change: 15.30, changePercent: 1.06 },
      { symbol: 'HDFC', name: 'HDFC Bank Limited', price: 1678.45, change: -12.85, changePercent: -0.76 },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', price: 945.30, change: 8.75, changePercent: 0.94 },
      { symbol: 'SBIN', name: 'State Bank of India', price: 567.80, change: -3.20, changePercent: -0.56 },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', price: 1678.45, change: -12.85, changePercent: -0.76 },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', price: 789.60, change: 12.40, changePercent: 1.60 },
      { symbol: 'ITC', name: 'ITC Limited', price: 234.50, change: 2.30, changePercent: 0.99 },
      { symbol: 'LT', name: 'Larsen & Toubro Limited', price: 2345.80, change: -18.90, changePercent: -0.80 },
    ];
    
    return allSymbols.filter(item => 
      item.symbol.toLowerCase().includes(query.toLowerCase()) ||
      item.name.toLowerCase().includes(query.toLowerCase())
    );
  }
}

export const dhanAPI = new DhanAPIService();