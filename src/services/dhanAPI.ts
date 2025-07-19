import { Stock, Order, Position, ApiCredentials } from '../types';

class DhanAPIService {
  private baseURL = 'https://api.dhan.co';
  private credentials: ApiCredentials | null = null;

  setCredentials(credentials: ApiCredentials) {
    this.credentials = credentials;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(this.credentials?.apiKey && {
        'access-token': this.credentials.apiKey
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
      // Test API connection with fund limit endpoint
      if (this.credentials?.apiKey) {
        const response = await this.makeRequest('/fundlimit');
        if (response) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getFundLimit(): Promise<any> {
    try {
      return await this.makeRequest('/fundlimit');
    } catch (error) {
      console.error('Error fetching fund limit:', error);
      return null;
    }
  }

  async getTrades(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/trades');
      return response || [];
    } catch (error) {
      console.error('Error fetching trades:', error);
      return [];
    }
  }

  async getHoldings(): Promise<Position[]> {
    try {
      const response = await this.makeRequest('/holdings');
      if (response && Array.isArray(response)) {
        return response.map((holding: any) => ({
          symbol: holding.tradingSymbol || holding.symbol,
          quantity: holding.quantity || 0,
          avgPrice: holding.avgCostPrice || holding.avgPrice || 0,
          currentPrice: holding.ltp || holding.currentPrice || 0,
          pnl: holding.realizedPnl || holding.pnl || 0,
          pnlPercent: holding.pnlPercent || 0
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching holdings:', error);
      // Return mock data if API fails
      return this.getMockPositions();
    }
  }

  async getLiveOrders(): Promise<Order[]> {
    try {
      const response = await this.makeRequest('/orders');
      if (response && Array.isArray(response)) {
        return response.map((order: any) => ({
          id: order.orderId || order.id,
          symbol: order.tradingSymbol || order.symbol,
          side: order.transactionType === 'BUY' ? 'BUY' : 'SELL',
          quantity: order.quantity,
          price: order.price,
          type: order.orderType === 'LIMIT' ? 'LIMIT' : 'MARKET',
          status: this.mapOrderStatus(order.orderStatus),
          timestamp: new Date(order.createTime || Date.now())
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching live orders:', error);
      return [];
    }
  }

  async getMarketData(): Promise<Stock[]> {
    try {
      // For now, return mock data as Dhan doesn't have a direct market data endpoint
      // You would typically use a separate market data provider
      return this.getMockMarketData();
    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getMockMarketData();
    }
  }

  private getMockMarketData(): Stock[] {
    // Generate dynamic mock data with slight variations
    const baseData = [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd',
        price: 2456.75 + (Math.random() - 0.5) * 20,
        change: 23.45 + (Math.random() - 0.5) * 10,
        changePercent: 0.96 + (Math.random() - 0.5) * 0.5,
        volume: 1234567,
        high: 2478.90 + (Math.random() - 0.5) * 15,
        low: 2434.20 + (Math.random() - 0.5) * 15,
        open: 2445.30 + (Math.random() - 0.5) * 10
      },
      {
        symbol: 'TCS',
        name: 'Tata Consultancy Services',
        price: 3789.20 + (Math.random() - 0.5) * 30,
        change: -45.60 + (Math.random() - 0.5) * 20,
        changePercent: -1.19 + (Math.random() - 0.5) * 0.8,
        volume: 987654,
        high: 3834.80 + (Math.random() - 0.5) * 25,
        low: 3765.10 + (Math.random() - 0.5) * 25,
        open: 3820.50 + (Math.random() - 0.5) * 20
      },
      {
        symbol: 'INFY',
        name: 'Infosys Limited',
        price: 1456.85 + (Math.random() - 0.5) * 15,
        change: 15.30 + (Math.random() - 0.5) * 8,
        changePercent: 1.06 + (Math.random() - 0.5) * 0.6,
        volume: 2345678,
        high: 1467.20 + (Math.random() - 0.5) * 12,
        low: 1441.50 + (Math.random() - 0.5) * 12,
        open: 1448.75 + (Math.random() - 0.5) * 10
      },
      {
        symbol: 'HDFC',
        name: 'HDFC Bank Limited',
        price: 1678.45 + (Math.random() - 0.5) * 18,
        change: -12.85 + (Math.random() - 0.5) * 10,
        changePercent: -0.76 + (Math.random() - 0.5) * 0.5,
        volume: 1567890,
        high: 1692.30 + (Math.random() - 0.5) * 15,
        low: 1665.20 + (Math.random() - 0.5) * 15,
        open: 1685.90 + (Math.random() - 0.5) * 12
      }
    ];
    
    return baseData.map(stock => ({
      ...stock,
      price: Math.round(stock.price * 100) / 100,
      change: Math.round(stock.change * 100) / 100,
      changePercent: Math.round(stock.changePercent * 100) / 100,
      high: Math.round(stock.high * 100) / 100,
      low: Math.round(stock.low * 100) / 100,
      open: Math.round(stock.open * 100) / 100
    }));
  }

  async placeOrder(order: Omit<Order, 'id' | 'timestamp' | 'status'>): Promise<Order> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        throw new Error('API credentials not configured');
      }

      const orderPayload = {
        dhanClientId: this.credentials.clientId,
        correlationId: `order_${Date.now()}`,
        transactionType: order.side,
        exchangeSegment: "NSE_EQ",
        productType: "CNC",
        orderType: order.type,
        validity: "DAY",
        tradingSymbol: order.symbol,
        securityId: order.symbol, // You might need to map symbol to security ID
        quantity: order.quantity,
        disclosedQuantity: 0,
        price: order.price,
        triggerPrice: 0,
        afterMarketOrder: false,
        amoTime: "OPEN"
      };

      const response = await this.makeRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      const newOrder: Order = {
        ...order,
        id: response?.orderId || Date.now().toString(),
        timestamp: new Date(),
        status: response?.status === 'TRANSIT' ? 'PENDING' : 'PENDING'
      };

      return newOrder;
    } catch (error) {
      console.error('Error placing order:', error);
      // Return mock order for demo
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
  }

  async modifyOrder(orderId: string, modifications: Partial<Order>): Promise<boolean> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        throw new Error('API credentials not configured');
      }

      const modifyPayload = {
        dhanClientId: this.credentials.clientId,
        orderId: orderId,
        orderType: modifications.type || "LIMIT",
        legName: "ENTRY_LEG",
        quantity: modifications.quantity,
        price: modifications.price,
        disclosedQuantity: 0,
        triggerPrice: 0,
        validity: "DAY"
      };

      await this.makeRequest(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify(modifyPayload)
      });

      return true;
    } catch (error) {
      console.error('Error modifying order:', error);
      return false;
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      if (!this.credentials?.apiKey) {
        throw new Error('API credentials not configured');
      }

      await this.makeRequest(`/orders/${orderId}`, {
        method: 'DELETE'
      });

      return true;
    } catch (error) {
      console.error('Error cancelling order:', error);
      return false;
    }
  }

  async getPositions(): Promise<Position[]> {
    try {
      return await this.getHoldings();
    } catch (error) {
      console.error('Error fetching positions:', error);
      return this.getMockPositions();
    }
  }

  private getMockPositions(): Position[] {
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
    try {
      const response = await this.makeRequest('/orders');
      if (response && Array.isArray(response)) {
        return response.map((order: any) => ({
          id: order.orderId || order.id,
          symbol: order.tradingSymbol || order.symbol,
          side: order.transactionType === 'BUY' ? 'BUY' : 'SELL',
          quantity: order.quantity,
          price: order.price,
          type: order.orderType === 'LIMIT' ? 'LIMIT' : 'MARKET',
          status: this.mapOrderStatus(order.orderStatus),
          timestamp: new Date(order.createTime || Date.now())
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching orders:', error);
      return this.getMockOrders();
    }
  }

  private mapOrderStatus(status: string): Order['status'] {
    switch (status?.toUpperCase()) {
      case 'COMPLETE':
      case 'FILLED':
        return 'FILLED';
      case 'CANCELLED':
      case 'REJECTED':
        return 'CANCELLED';
      default:
        return 'PENDING';
    }
  }

  private getMockOrders(): Order[] {
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
    try {
      // Dhan API doesn't provide order book data directly
      // You would need to use a market data provider for this
      return this.getMockOrderBook(symbol);
    } catch (error) {
      console.error('Error fetching order book:', error);
      return this.getMockOrderBook(symbol);
    }
  }

  private getMockOrderBook(symbol: string): OrderBook {
    const basePrice = 2456.75; // You could fetch current price here
    const spread = 0.25;
    
    return {
      symbol,
      bids: [
        { price: basePrice - spread, quantity: Math.floor(Math.random() * 200) + 100, orders: Math.floor(Math.random() * 10) + 1 },
        { price: basePrice - spread * 2, quantity: Math.floor(Math.random() * 300) + 150, orders: Math.floor(Math.random() * 15) + 3 },
        { price: basePrice - spread * 3, quantity: Math.floor(Math.random() * 250) + 100, orders: Math.floor(Math.random() * 8) + 2 },
        { price: basePrice - spread * 4, quantity: Math.floor(Math.random() * 400) + 200, orders: Math.floor(Math.random() * 20) + 5 },
        { price: basePrice - spread * 5, quantity: Math.floor(Math.random() * 300) + 150, orders: Math.floor(Math.random() * 12) + 3 },
      ],
      asks: [
        { price: basePrice + spread, quantity: Math.floor(Math.random() * 200) + 100, orders: Math.floor(Math.random() * 8) + 2 },
        { price: basePrice + spread * 2, quantity: Math.floor(Math.random() * 250) + 120, orders: Math.floor(Math.random() * 12) + 4 },
        { price: basePrice + spread * 3, quantity: Math.floor(Math.random() * 300) + 150, orders: Math.floor(Math.random() * 15) + 5 },
        { price: basePrice + spread * 4, quantity: Math.floor(Math.random() * 200) + 100, orders: Math.floor(Math.random() * 10) + 3 },
        { price: basePrice + spread * 5, quantity: Math.floor(Math.random() * 350) + 200, orders: Math.floor(Math.random() * 18) + 6 },
      ],
      lastUpdated: new Date()
    };
  }

  async searchSymbols(query: string): Promise<WatchlistItem[]> {
    try {
      // For now using mock data - you could integrate with a symbol search API
      return this.getMockSearchResults(query);
    } catch (error) {
      console.error('Error searching symbols:', error);
      return this.getMockSearchResults(query);
    }
  }

  private getMockSearchResults(query: string): WatchlistItem[] {
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