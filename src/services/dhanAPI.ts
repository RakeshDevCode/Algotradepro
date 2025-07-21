import { Stock, Order, Position, ApiCredentials, OrderBook, WatchlistItem } from '../types';
import { csvParserService } from './csvParser';
import { webSocketService, TickerData } from './websocketService';
import { MarketHours } from './marketHours';

class DhanAPIService {
  private baseURL = '/api';
  private marketDataURL = '/api';
  private credentials: ApiCredentials | null = null;
  private orderStatusCallbacks: Map<string, (status: string, message: string) => void> = new Map();
  
  // Nifty 50 top 10 stocks with their security IDs
  private readonly NIFTY_TOP_10 = [
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

  private marketDataCache: Map<string, Stock> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  setCredentials(credentials: ApiCredentials) {
    this.credentials = credentials;
    
    // Initialize WebSocket connection for live data
    if (credentials.apiKey && credentials.clientId) {
      // Only initialize WebSocket during market hours
      if (MarketHours.isMarketOpen()) {
        webSocketService.setCredentials(credentials.apiKey, credentials.clientId);
      }
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const baseUrl = this.baseURL;
    const url = `${baseUrl}${endpoint}`;
    
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

    // Handle different response types
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      
      try {
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
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
      // Return text for non-JSON responses
      return response.text();
    }
  }

  async authenticate(): Promise<boolean> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        console.error('Missing credentials for authentication');
        return false;
      }
      
      // Test authentication with a simple API call
      const response = await this.makeRequest('/v2/fundlimit');
      
      // Check if response is successful
      if (response && (response.status === 'success' || response.availabelBalance !== undefined || response.dhanClientId)) {
        console.log('Authentication successful');
        return true;
      } else {
        console.error('Authentication failed - invalid response:', response);
        return false;
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      return false;
    }
  }

  async getMarketData(forceRefresh: boolean = false): Promise<Stock[]> {
    try {
      const now = Date.now();
      
      // Return cached data if available and not forcing refresh
      if (!forceRefresh && this.marketDataCache.size > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
        return Array.from(this.marketDataCache.values());
      }

      // Try to fetch live data if market is open and credentials are available
      if (this.credentials?.apiKey && this.credentials?.clientId) {
        try {
          const securityIds = this.NIFTY_TOP_10.map(s => parseInt(s.securityId));
          const response = await this.makeRequest('/v2/marketfeed/ohlc', {
            method: 'POST',
            body: JSON.stringify({
              NSE_EQ: securityIds
            })
          });

          if (response?.status === 'success' && response?.data?.NSE_EQ) {
            Object.entries(response.data.NSE_EQ).forEach(([securityId, quote]: [string, any]) => {
              const security = this.NIFTY_TOP_10.find(s => s.securityId === securityId);
              if (security && quote.last_price) {
                const prevClose = quote.ohlc?.close || quote.last_price;
                const change = quote.last_price - prevClose;
                const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
                
                const stock: Stock = {
                  symbol: security.symbol,
                  name: security.name,
                  price: quote.last_price,
                  change: change,
                  changePercent: changePercent,
                  volume: quote.volume || 0,
                  high: quote.ohlc?.high || quote.last_price,
                  low: quote.ohlc?.low || quote.last_price,
                  open: quote.ohlc?.open || quote.last_price
                };
                this.marketDataCache.set(stock.symbol, stock);
              }
            });
          }
        } catch (apiError) {
          console.warn('Live API failed, using base data:', apiError);
        }
      }

      // If no live data was fetched, initialize with base data
      if (this.marketDataCache.size === 0) {
        const baseData = this.getNiftyTop10Data();
        baseData.forEach(stock => {
          this.marketDataCache.set(stock.symbol, stock);
        });
      }

      this.lastFetchTime = now;
      return Array.from(this.marketDataCache.values());

    } catch (error) {
      console.error('Error fetching market data:', error);
      return this.getNiftyTop10Data();
    }
  }

  private getNiftyTop10Data(): Stock[] {
    return this.NIFTY_TOP_10.map((stock, index) => ({
      symbol: stock.symbol,
      name: stock.name,
      price: 0, // Will be updated with live data
      change: 0,
      changePercent: 0,
      volume: 0,
      high: 0,
      low: 0,
      open: 0
    }));
  }

  async getLivePrice(symbol: string): Promise<Stock | null> {
    try {
      // Check cache first
      const cachedStock = this.marketDataCache.get(symbol);
      if (cachedStock && cachedStock.price > 0) {
        return cachedStock;
      }

      const stock = this.NIFTY_TOP_10.find(s => s.symbol === symbol);
      if (!stock) {
        return null;
      }

      if (this.credentials?.apiKey && this.credentials?.clientId) {
        try {
          const response = await this.makeRequest('/v2/marketfeed/ohlc', {
            method: 'POST',
            body: JSON.stringify({
              NSE_EQ: [parseInt(stock.securityId)]
            })
          });
          
          if (response?.status === 'success' && response?.data?.NSE_EQ?.[stock.securityId]) {
            const quote = response.data.NSE_EQ[stock.securityId];
            const prevClose = quote.ohlc?.close || quote.last_price;
            const change = quote.last_price - prevClose;
            const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
            
            const liveStock: Stock = {
              symbol: stock.symbol,
              name: stock.name,
              price: quote.last_price,
              change: change,
              changePercent: changePercent,
              volume: quote.volume || 0,
              high: quote.ohlc?.high || quote.last_price,
              low: quote.ohlc?.low || quote.last_price,
              open: quote.ohlc?.open || quote.last_price
            };
            this.marketDataCache.set(symbol, liveStock);
            return liveStock;
          }
        } catch (apiError) {
          console.warn('Live price API failed for', symbol, ':', apiError);
        }
      }

      // Fallback to base data
      const fallbackStock: Stock = {
        symbol: stock.symbol,
        name: stock.name,
        price: 0,
        change: 0,
        changePercent: 0,
        volume: 0,
        high: 0,
        low: 0,
        open: 0
      };
      this.marketDataCache.set(symbol, fallbackStock);
      return fallbackStock;

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

      const queryLower = query.toLowerCase();
      const matchingStocks = this.NIFTY_TOP_10.filter(stock => 
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
      return this.NIFTY_TOP_10.filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      ).map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        price: 0,
        change: 0,
        changePercent: 0
      }));
    }
  }

  async placeOrder(order: Omit<Order, 'id' | 'timestamp' | 'status'>): Promise<Order> {
    try {
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        throw new Error('API credentials not configured');
      }

      const security = this.NIFTY_TOP_10.find(s => s.symbol === order.symbol);
      if (!security) {
        throw new Error(`Security not found for symbol: ${order.symbol}`);
      }

      const orderPayload = {
        dhanClientId: this.credentials.clientId,
        correlationId: `order_${Date.now()}`,
        transactionType: order.side,
        exchangeSegment: 'NSE_EQ',
        productType: "CNC",
        orderType: order.type,
        validity: "DAY",
        tradingSymbol: order.symbol,
        securityId: security.securityId,
        quantity: order.quantity,
        disclosedQuantity: 0,
        price: order.type === 'MARKET' ? 0 : order.price,
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
      if (!this.credentials?.apiKey || !this.credentials?.clientId) {
        console.warn('API credentials not configured');
        return [];
      }

      const response = await this.makeRequest('/orders');
      
      if (response && response.data && Array.isArray(response.data)) {
        return response.data.map((order: any) => ({
          id: order.orderId || order.id || Date.now().toString(),
          symbol: order.tradingSymbol || order.symbol || 'UNKNOWN',
          side: order.transactionType === 'BUY' ? 'BUY' : 'SELL',
          quantity: order.quantity || 0,
          price: order.price || 0,
          type: order.orderType === 'LIMIT' ? 'LIMIT' : 'MARKET',
          status: this.mapOrderStatus(order.orderStatus),
          timestamp: new Date(order.createTime || Date.now())
        }));
      } else if (response && Array.isArray(response)) {
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
      console.warn('Orders API unavailable, returning empty list:', error);
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
      const response = await this.makeRequest('/positions');
      if (response && Array.isArray(response)) {
        return response.map((position: any) => ({
          symbol: position.tradingSymbol || position.symbol,
          quantity: position.netQty || 0,
          avgPrice: position.buyAvg || position.avgPrice || 0,
          currentPrice: 0, // Will be updated with live price
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
      const response = await this.makeRequest('/holdings');
      if (response && Array.isArray(response)) {
        return response.map((holding: any) => ({
          symbol: holding.tradingSymbol || holding.symbol,
          quantity: holding.totalQty || 0,
          avgPrice: holding.avgCostPrice || 0,
          currentPrice: 0, // Will be updated with live price
          pnl: 0, // Calculate based on current price
          pnlPercent: 0
        }));
      }
      return [];
    } catch (error) {
      console.warn('Holdings API unavailable:', error);
      return [];
    }
  }

  getStockPrice(symbol: string): number {
    const cachedStock = this.marketDataCache.get(symbol);
    if (cachedStock) {
      return cachedStock.price;
    }
    
    const stock = this.NIFTY_TOP_10.find(s => s.symbol === symbol);
    return stock?.price || 0;
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
    this.marketDataCache.clear();
    this.orderStatusCallbacks.clear();
  }
}

export const dhanAPI = new DhanAPIService();