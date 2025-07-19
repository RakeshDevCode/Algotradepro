import { Stock, Order, Position, ApiCredentials, OrderBook, WatchlistItem } from '../types';
import { symbolMappingService, POPULAR_STOCKS } from './symbolMapping';

class DhanAPIService {
  private baseURL = '/api';
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
      console.warn('Holdings API unavailable, using mock data:', error);
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
      // Get only popular stocks instead of all 50+ stocks
      const popularSymbols = symbolMappingService.getPopularSymbols().slice(0, 8); // Show top 8
      return this.getMockMarketDataForSymbols(popularSymbols);
    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getMockMarketDataForSymbols(['', 'TCS', 'HDFCBANK', 'INFY']);
    }
  }

  private getMockMarketDataForSymbols(symbols: string[]): Stock[] {
    // Base price data for popular stocks
    const basePrices: Record<string, any> = {
      '': { price: 1476.00, name: ' Industries' },
      'TCS': { price: 3189.60, name: 'Tata Consultancy Services' },
      'HDFCBANK': { price: 1956.00, name: 'HDFC Bank' },
      'INFY': { price: 1456.85, name: 'Infosys' },
      'ICICIBANK': { price: 1426.70, name: 'ICICI Bank' },
      'BHARTIARTL': { price: 1902.00, name: 'Bharti Airtel' },
      'ITC': { price: 422.00, name: 'ITC' },
      'SBIN': { price: 823.00, name: 'State Bank of India' },
      'LT': { price: 3468.70, name: 'Larsen & Toubro' },
      'KOTAKBANK': { price: 2132.00, name: 'Kotak Mahindra Bank' }
    };
    
    return symbols.map(symbol => {
      const baseData = basePrices[symbol] || { price: 1000 + Math.random() * 2000, name: symbol };
      const securityInfo = symbolMappingService.getSecurityInfo(symbol);
      
      // Generate dynamic variations
      const priceVariation = (Math.random() - 0.5) * (baseData.price * 0.02); // ±2% variation
      const currentPrice = baseData.price + priceVariation;
      const change = priceVariation + (Math.random() - 0.5) * 20;
      const changePercent = (change / baseData.price) * 100;
      
      return {
        symbol,
        name: securityInfo?.customSymbol || baseData.name,
        price: Math.round(currentPrice * 100) / 100,
        change: Math.round(change * 100) / 100,
        changePercent: Math.round(changePercent * 100) / 100,
        volume: Math.floor(Math.random() * 2000000) + 500000,
        high: Math.round((currentPrice + Math.abs(change) * 0.5) * 100) / 100,
        low: Math.round((currentPrice - Math.abs(change) * 0.5) * 100) / 100,
        open: Math.round((baseData.price + (Math.random() - 0.5) * 10) * 100) / 100
      };
    });
  }

  async placeOrder(order: Omit<Order, 'id' | 'timestamp' | 'status'>): Promise<Order> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        throw new Error('API credentials not configured');
      }

      // Get security ID for the symbol
      const securityId = symbolMappingService.getSecurityId(order.symbol);
      if (!securityId) {
        throw new Error(`Security ID not found for symbol: ${order.symbol}`);
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
        securityId: securityId.toString(),
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
        symbol: '',
        side: 'BUY',
        quantity: 100,
        price: 1476.00,
        type: 'LIMIT',
        status: 'FILLED',
        timestamp: new Date(Date.now())
      },
      {
        id: '2',
        symbol: 'TCS',
        side: 'SELL',
        quantity: 25,
        price: 3200.00,
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
    const basePrice = 0.00; // You could fetch current price here
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
    // Use symbol mapping service to search
    const searchResults = symbolMappingService.searchSymbols(query, 20);
    
    return searchResults.map(info => ({
      symbol: info.tradingSymbol,
      name: info.customSymbol,
      price: 1000 + Math.random() * 2000, // Mock price
      change: (Math.random() - 0.5) * 50,
      changePercent: (Math.random() - 0.5) * 5
    }));
  }
}

export const dhanAPI = new DhanAPIService();