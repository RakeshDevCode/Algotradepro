interface WebSocketMessage {
  RequestCode: number;
  InstrumentCount?: number;
  InstrumentList?: Array<{
    ExchangeSegment: string;
    SecurityId: string;
  }>;
}

interface TickerData {
  securityId: string;
  ltp: number;
  lastTradeTime: number;
  volume: number;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private subscribers: Map<string, (data: TickerData) => void> = new Map();
  private subscribedInstruments: Set<string> = new Set();
  private credentials: { token: string; clientId: string } | null = null;
  private isConnected = false;
  private pingInterval: NodeJS.Timeout | null = null;

  setCredentials(token: string, clientId: string) {
    this.credentials = { token, clientId };
  }

  connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.credentials) {
        reject(new Error('Credentials not set'));
        return;
      }

      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        resolve(true);
        return;
      }

      const wsUrl = `wss://api-feed.dhan.co?version=2&token=${this.credentials.token}&clientId=${this.credentials.clientId}&authType=2`;
      
      try {
        this.ws = new WebSocket(wsUrl);
        
        this.ws.onopen = () => {
          console.log('WebSocket connected to Dhan Live Feed');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.startPing();
          resolve(true);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.stopPing();
          
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  private startPing() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send ping to keep connection alive
        this.ws.send(JSON.stringify({ RequestCode: 16 }));
      }
    }, 10000); // Every 10 seconds as per Dhan requirements
  }

  private stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private reconnect() {
    this.reconnectAttempts++;
    console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, this.reconnectDelay * this.reconnectAttempts);
  }

  subscribeToInstruments(instruments: Array<{ exchangeSegment: string; securityId: string }>) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket not connected');
      return;
    }

    // Limit to 100 instruments per message as per Dhan limits
    const chunks = this.chunkArray(instruments, 100);
    
    chunks.forEach(chunk => {
      const message: WebSocketMessage = {
        RequestCode: 15,
        InstrumentCount: chunk.length,
        InstrumentList: chunk.map(inst => ({
          ExchangeSegment: inst.exchangeSegment,
          SecurityId: inst.securityId
        }))
      };

      this.ws!.send(JSON.stringify(message));
      
      // Track subscribed instruments
      chunk.forEach(inst => {
        this.subscribedInstruments.add(inst.securityId);
      });
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  private handleMessage(data: ArrayBuffer) {
    try {
      const view = new DataView(data);
      
      // Parse 8-byte header
      const responseCode = view.getUint16(0, true); // Little endian
      const securityId = view.getUint32(2, true).toString();
      
      switch (responseCode) {
        case 2: // Ticker data
          this.parseTickerData(view, securityId);
          break;
        case 4: // Quote data
          this.parseQuoteData(view, securityId);
          break;
        case 8: // Full packet
          this.parseFullPacket(view, securityId);
          break;
        case 50: // Disconnection
          console.log('Server requested disconnection');
          this.disconnect();
          break;
        default:
          console.log('Unknown response code:', responseCode);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private parseTickerData(view: DataView, securityId: string) {
    try {
      // Parse ticker data from binary format
      const ltp = view.getFloat64(8, true) / 100; // Assuming price is in paise
      const lastTradeTime = view.getUint32(16, true);
      
      const tickerData: TickerData = {
        securityId,
        ltp,
        lastTradeTime,
        volume: 0,
        open: ltp,
        high: ltp,
        low: ltp,
        close: ltp,
        change: 0,
        changePercent: 0
      };

      this.notifySubscribers(securityId, tickerData);
    } catch (error) {
      console.error('Error parsing ticker data:', error);
    }
  }

  private parseQuoteData(view: DataView, securityId: string) {
    try {
      // Parse quote data with more fields
      const ltp = view.getFloat64(8, true) / 100;
      const volume = view.getUint32(16, true);
      const open = view.getFloat64(20, true) / 100;
      const high = view.getFloat64(28, true) / 100;
      const low = view.getFloat64(36, true) / 100;
      const close = view.getFloat64(44, true) / 100;
      
      const change = ltp - close;
      const changePercent = close > 0 ? (change / close) * 100 : 0;

      const quoteData: TickerData = {
        securityId,
        ltp,
        lastTradeTime: Date.now(),
        volume,
        open,
        high,
        low,
        close,
        change,
        changePercent
      };

      this.notifySubscribers(securityId, quoteData);
    } catch (error) {
      console.error('Error parsing quote data:', error);
    }
  }

  private parseFullPacket(view: DataView, securityId: string) {
    // Similar to parseQuoteData but with market depth
    this.parseQuoteData(view, securityId);
  }

  private notifySubscribers(securityId: string, data: TickerData) {
    const callback = this.subscribers.get(securityId);
    if (callback) {
      callback(data);
    }
  }

  subscribe(securityId: string, callback: (data: TickerData) => void) {
    this.subscribers.set(securityId, callback);
  }

  unsubscribe(securityId: string) {
    this.subscribers.delete(securityId);
  }

  disconnect() {
    if (this.ws) {
      // Send graceful disconnect message
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ RequestCode: 12 }));
      }
      this.ws.close();
      this.ws = null;
    }
    this.stopPing();
    this.isConnected = false;
    this.subscribers.clear();
    this.subscribedInstruments.clear();
  }

  isWebSocketConnected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

export const webSocketService = new WebSocketService();
export type { TickerData };