import { Stock, Order, Position, ApiCredentials, OrderBook, WatchlistItem } from '../types';
import { symbolMappingService, POPULAR_STOCKS } from './symbolMapping';
import { MarketHours } from './marketHours';

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
      console.warn('Holdings API unavailable, returning empty positions:', error);
      return [];
    }
  }

  async getLiveQuotes(symbols: string[]): Promise<any[]> {
    try {
      if (!MarketHours.isMarketOpen()) {
        console.warn('Market is closed, cannot fetch live quotes');
        return [];
      }

      // Get security IDs for symbols
      const securityIds = symbols
        .map(symbol => symbolMappingService.getSecurityId(symbol))
        .filter(id => id !== null);

      if (securityIds.length === 0) {
        return [];
      }

      // Dhan API endpoint for live quotes
      const response = await this.makeRequest('/marketfeed/ltp', {
        method: 'POST',
        body: JSON.stringify({
          NSE_EQ: securityIds
        })
      });

      return response?.data || [];
    } catch (error) {
      console.error('Error fetching live quotes:', error);
      return [];
    }
  }

  async getMarketData(): Promise<Stock[]> {
    try {
      // Only fetch live data during market hours
      if (!MarketHours.isMarketOpen()) {
        console.warn('Market is closed. Showing last known prices.');
        return this.getClosedMarketData();
      }

      // Get popular symbols that are available in mapping
      const popularSymbols = symbolMappingService.getPopularSymbols().slice(0, 8);
      
      if (!this.credentials?.apiKey) {
        console.warn('No API credentials available');
        return this.getClosedMarketData();
      }

      // Fetch live quotes
      const liveQuotes = await this.getLiveQuotes(popularSymbols);
      
      if (liveQuotes.length === 0) {
        return this.getClosedMarketData();
      }

      // Convert live quotes to Stock format
      return liveQuotes.map((quote: any) => {
        const symbol = symbolMappingService.getTradingSymbol(quote.securityId) || '';
        const securityInfo = symbolMappingService.getSecurityInfo(symbol);
        
        return {
          symbol,
          name: securityInfo?.customSymbol || symbol,
          price: quote.ltp || 0,
          change: (quote.ltp || 0) - (quote.prev_close || 0),
          changePercent: quote.prev_close ? (((quote.ltp || 0) - quote.prev_close) / quote.prev_close) * 100 : 0,
          volume: quote.volume || 0,
          high: quote.high || quote.ltp || 0,
          low: quote.low || quote.ltp || 0,
          open: quote.open || quote.ltp || 0
        };
      }).filter(stock => stock.symbol); // Filter out invalid stocks
      
    } catch (error) {
      console.error('Error fetching live market data:', error);
      return this.getClosedMarketData();
    }
  }

  private getClosedMarketData(): Stock[] {
    // Return static data when market is closed or API fails
    const popularSymbols = symbolMappingService.getPopularSymbols().slice(0, 8);
    
    // Base prices for popular stocks (last known closing prices)
    const basePrices: Record<string, any> = {
      'RELIANCE': { price: 1476.00, name: 'Reliance Industries' },
      'TCS': { price: 3189.60, name: 'Tata Consultancy Services' },
      'HDFCBANK': { price: 1956.00, name: 'HDFC Bank' },
      'INFY': { price: 1456.85, name: 'Infosys' },
      'ICICIBANK': { price: 1426.70, name: 'ICICI Bank' },
      'BHARTIARTL': { price: 1902.00, name: 'Bharti Airtel' },
      'ITC': { price: 422.00, name: 'ITC' },
      'SBIN': { price: 823.00, name: 'State Bank of India' }
    };
    
    return popularSymbols.map(symbol => {
      const baseData = basePrices[symbol] || { price: 1000, name: symbol };
      const securityInfo = symbolMappingService.getSecurityInfo(symbol);
      
      return {
        symbol,
        name: securityInfo?.customSymbol || baseData.name,
        price: baseData.price,
        change: 0, // No change when market is closed
        changePercent: 0,
        volume: 0,
        high: baseData.price,
        low: baseData.price,
        open: baseData.price
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
        status: response?.status === 'TRANSIT' ? 'PENDING' : 'PENDING'
      };

      return newOrder;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
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
      return [];
    }
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
    const basePrice = 1000; // You could fetch current price here
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
      // Use symbol mapping service to search
      const searchResults = symbolMappingService.searchSymbols(query, 20);
      
      return searchResults.map(info => ({
        symbol: info.tradingSymbol,
        name: info.customSymbol,
        price: 0, // Will be updated with live data if available
        change: 0,
        changePercent: 0
      }));
    } catch (error) {
      console.error('Error searching symbols:', error);
      return [];
    }
  }
}

export const dhanAPI = new DhanAPIService();