import { Stock, Order, Position, ApiCredentials, OrderBook, WatchlistItem } from '../types';
import { csvParserService } from './csvParser';
import { webSocketService, TickerData } from './websocketService';
import { MarketHours } from './marketHours';

class DhanAPIService {
  private baseURL = '/api';
  private credentials: ApiCredentials | null = null;
  private liveDataCache: Map<string, Stock> = new Map();
  private orderStatusCallbacks: Map<string, (status: string, message: string) => void> = new Map();

  setCredentials(credentials: ApiCredentials) {
    this.credentials = credentials;
    
    // Initialize WebSocket connection for live data
    if (credentials.apiKey && credentials.clientId) {
      webSocketService.setCredentials(credentials.apiKey, credentials.clientId);
      this.initializeLiveData();
    }
  }

  private async initializeLiveData() {
    try {
      if (MarketHours.isMarketOpen()) {
        await webSocketService.connect();
        
        // Subscribe to popular stocks
        const popularSecurities = csvParserService.getPopularSecurities();
        const instruments = popularSecurities.map(security => ({
          exchangeSegment: security.exchangeSegment,
          securityId: security.securityId
        }));

        if (instruments.length > 0) {
          webSocketService.subscribeToInstruments(instruments);
          
          // Set up data handlers
          popularSecurities.forEach(security => {
            webSocketService.subscribe(security.securityId, (data: TickerData) => {
              this.updateLiveData(security.securityId, data);
            });
          });
        }
      }
    } catch (error) {
      console.error('Failed to initialize live data:', error);
    }
  }

  private updateLiveData(securityId: string, tickerData: TickerData) {
    const security = csvParserService.getSecurityById(securityId);
    if (!security) return;

    const stock: Stock = {
      symbol: security.tradingSymbol,
      name: security.customSymbol,
      price: tickerData.ltp,
      change: tickerData.change,
      changePercent: tickerData.changePercent,
      volume: tickerData.volume,
      high: tickerData.high,
      low: tickerData.low,
      open: tickerData.open
    };

    this.liveDataCache.set(securityId, stock);
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
      if (this.credentials?.apiKey) {
        const response = await this.makeRequest('/fundlimit');
        return !!response;
      }
      return false;
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getMarketData(): Promise<Stock[]> {
    try {
      if (!MarketHours.isMarketOpen()) {
        return this.getClosedMarketData();
      }

      // If WebSocket is connected and we have live data, use it
      if (webSocketService.isWebSocketConnected() && this.liveDataCache.size > 0) {
        return Array.from(this.liveDataCache.values()).slice(0, 8);
      }

      // Fallback to REST API for live quotes
      const popularSecurities = csvParserService.getPopularSecurities().slice(0, 8);
      
      if (!this.credentials?.apiKey || popularSecurities.length === 0) {
        return this.getClosedMarketData();
      }

      try {
        const securityIds = popularSecurities.map(s => s.securityId);
        const response = await this.makeRequest('/marketfeed/ltp', {
          method: 'POST',
          body: JSON.stringify({
            NSE_EQ: securityIds
          })
        });

        if (response?.data && Array.isArray(response.data)) {
          return response.data.map((quote: any) => {
            const security = csvParserService.getSecurityById(quote.securityId?.toString());
            if (!security) return null;

            return {
              symbol: security.tradingSymbol,
              name: security.customSymbol,
              price: quote.ltp || 0,
              change: (quote.ltp || 0) - (quote.prev_close || 0),
              changePercent: quote.prev_close ? (((quote.ltp || 0) - quote.prev_close) / quote.prev_close) * 100 : 0,
              volume: quote.volume || 0,
              high: quote.high || quote.ltp || 0,
              low: quote.low || quote.ltp || 0,
              open: quote.open || quote.ltp || 0
            };
          }).filter(Boolean);
        }
      } catch (apiError) {
        console.warn('Live API failed, using fallback data:', apiError);
      }

      return this.getClosedMarketData();
      
    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getClosedMarketData();
    }
  }

  private getClosedMarketData(): Stock[] {
    const popularSecurities = csvParserService.getPopularSecurities().slice(0, 8);
    
    const basePrices: Record<string, number> = {
      'RELIANCE': 1476.00,
      'TCS': 3189.60,
      'HDFCBANK': 1956.00,
      'INFY': 1456.85,
      'ICICIBANK': 1426.70,
      'BHARTIARTL': 1902.00,
      'ITC': 422.00,
      'SBIN': 823.00
    };
    
    return popularSecurities.map(security => ({
      symbol: security.tradingSymbol,
      name: security.customSymbol,
      price: basePrices[security.tradingSymbol] || 1000,
      change: 0,
      changePercent: 0,
      volume: 0,
      high: basePrices[security.tradingSymbol] || 1000,
      low: basePrices[security.tradingSymbol] || 1000,
      open: basePrices[security.tradingSymbol] || 1000
    }));
  }

  async placeOrder(order: Omit<Order, 'id' | 'timestamp' | 'status'>): Promise<Order> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        throw new Error('API credentials not configured');
      }

      const security = csvParserService.getSecurityBySymbol(order.symbol);
      if (!security) {
        throw new Error(`Security not found for symbol: ${order.symbol}`);
      }

      const orderPayload = {
        dhanClientId: this.credentials.clientId,
        correlationId: `order_${Date.now()}`,
        transactionType: order.side,
        exchangeSegment: security.exchangeSegment,
        productType: "CNC",
        orderType: order.type,
        validity: "DAY",
        tradingSymbol: order.symbol,
        securityId: security.securityId,
        quantity: order.quantity,
        disclosedQuantity: 0,
        price: order.price,
        triggerPrice: 0,
        afterMarketOrder: false,
        amoTime: "OPEN",
        boProfitValue: 0,
        boStopLossValue: 0,
        drvExpiryDate: "NA",
        drvOptionType: "NA",
        drvStrikePrice: 0
      };

      const response = await this.makeRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderPayload)
      });

      const newOrder: Order = {
        ...order,
        id: response?.orderId || Date.now().toString(),
        timestamp: new Date(),
        status: 'PENDING'
      };

      // Notify about order placement
      const callback = this.orderStatusCallbacks.get(newOrder.id);
      if (callback) {
        callback('PLACED', `Order placed successfully for ${order.symbol}`);
      }

      return newOrder;
    } catch (error) {
      console.error('Error placing order:', error);
      
      // Notify about order failure
      const tempId = Date.now().toString();
      const callback = this.orderStatusCallbacks.get(tempId);
      if (callback) {
        callback('REJECTED', `Order failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      throw error;
    }
  }

  onOrderStatus(orderId: string, callback: (status: string, message: string) => void) {
    this.orderStatusCallbacks.set(orderId, callback);
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
      return [];
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

  async getPositions(): Promise<Position[]> {
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
      console.warn('Holdings API unavailable, returning empty positions:', error);
      return [];
    }
  }

  async searchSymbols(query: string): Promise<WatchlistItem[]> {
    try {
      const searchResults = csvParserService.searchSecurities(query, 20);
      
      return searchResults.map(security => ({
        symbol: security.tradingSymbol,
        name: security.customSymbol,
        price: 0,
        change: 0,
        changePercent: 0
      }));
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }

  async getOrderBook(symbol: string): Promise<OrderBook> {
    // Mock order book for now
    const basePrice = 1000;
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

  disconnect() {
    webSocketService.disconnect();
    this.liveDataCache.clear();
    this.orderStatusCallbacks.clear();
  }
}

export const dhanAPI = new DhanAPIService();