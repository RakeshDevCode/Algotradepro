// Symbol mapping service for Dhan API
export interface SecurityInfo {
  exchangeSegment: string;
  securityId: number;
  tradingSymbol: string;
  customSymbol: string;
  instrumentType: string;
  series: string;
}

// Popular stocks to display in dashboard (top 20 most traded)
export const POPULAR_STOCKS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 
  'BHARTIARTL', 'ITC', 'SBIN', 'LT', 'KOTAKBANK',
  'AXISBANK', 'ASIANPAINT', 'MARUTI', 'SUNPHARMA', 'TITAN',
  'ULTRACEMCO', 'NESTLEIND', 'WIPRO', 'POWERGRID', 'NTPC'
];

class SymbolMappingService {
  private symbolMap: Map<string, SecurityInfo> = new Map();
  private securityIdMap: Map<number, SecurityInfo> = new Map();

  // Initialize with the provided security data
  initializeMapping(securityData: any[]) {
    securityData.forEach(item => {
      const securityInfo: SecurityInfo = {
        exchangeSegment: item.exchangeSegment,
        securityId: item.securityId,
        tradingSymbol: item.SEM_TRADING_SYMBOL,
        customSymbol: item.SEM_CUSTOM_SYMBOL,
        instrumentType: item.SEM_EXCH_INSTRUMENT_TYPE,
        series: item.SEM_SERIES
      };
      
      this.symbolMap.set(item.SEM_TRADING_SYMBOL, securityInfo);
      this.securityIdMap.set(item.securityId, securityInfo);
    });
  }

  // Get security ID by trading symbol
  getSecurityId(tradingSymbol: string): number | null {
    const security = this.symbolMap.get(tradingSymbol);
    return security ? security.securityId : null;
  }

  // Get trading symbol by security ID
  getTradingSymbol(securityId: number): string | null {
    const security = this.securityIdMap.get(securityId);
    return security ? security.tradingSymbol : null;
  }

  // Get security info by trading symbol
  getSecurityInfo(tradingSymbol: string): SecurityInfo | null {
    return this.symbolMap.get(tradingSymbol) || null;
  }

  // Get all available symbols
  getAllSymbols(): string[] {
    return Array.from(this.symbolMap.keys());
  }

  // Get popular symbols that are available in the mapping
  getPopularSymbols(): string[] {
    return POPULAR_STOCKS.filter(symbol => this.symbolMap.has(symbol));
  }

  // Search symbols by query
  searchSymbols(query: string, limit: number = 10): SecurityInfo[] {
    const results: SecurityInfo[] = [];
    const queryLower = query.toLowerCase();
    
    for (const [symbol, info] of this.symbolMap) {
      if (
        symbol.toLowerCase().includes(queryLower) ||
        info.customSymbol.toLowerCase().includes(queryLower)
      ) {
        results.push(info);
        if (results.length >= limit) break;
      }
    }
    
    return results;
  }
}

export const symbolMappingService = new SymbolMappingService();

// Initialize with the provided data
const SECURITY_DATA = [
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 16921,
    "SEM_TRADING_SYMBOL": "20MICRONS",
    "SEM_CUSTOM_SYMBOL": "20 Microns",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 30105,
    "SEM_TRADING_SYMBOL": "GOLD360",
    "SEM_CUSTOM_SYMBOL": "360 One Gold ETF",
    "SEM_EXCH_INSTRUMENT_TYPE": "ETF",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 13061,
    "SEM_TRADING_SYMBOL": "360ONE",
    "SEM_CUSTOM_SYMBOL": "360 One WAM",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 7,
    "SEM_TRADING_SYMBOL": "AARTIIND",
    "SEM_CUSTOM_SYMBOL": "Aarti Industries",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 5385,
    "SEM_TRADING_SYMBOL": "AAVAS",
    "SEM_CUSTOM_SYMBOL": "Aavas Financiers",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 13,
    "SEM_TRADING_SYMBOL": "ABB",
    "SEM_CUSTOM_SYMBOL": "ABB",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 17903,
    "SEM_TRADING_SYMBOL": "ABBOTINDIA",
    "SEM_CUSTOM_SYMBOL": "Abbott",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 22,
    "SEM_TRADING_SYMBOL": "ACC",
    "SEM_CUSTOM_SYMBOL": "ACC",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 7053,
    "SEM_TRADING_SYMBOL": "ACCELYA",
    "SEM_CUSTOM_SYMBOL": "Accelya Solutions",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 13587,
    "SEM_TRADING_SYMBOL": "ACE",
    "SEM_CUSTOM_SYMBOL": "Action Construction Equipment",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 25,
    "SEM_TRADING_SYMBOL": "ADANIENT",
    "SEM_CUSTOM_SYMBOL": "Adani Enterprises",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 10217,
    "SEM_TRADING_SYMBOL": "ADANIENSOL",
    "SEM_CUSTOM_SYMBOL": "Adani Energy Solutions",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  }
];

// Add popular stocks that might not be in the provided data
const ADDITIONAL_POPULAR_STOCKS = [
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 2885,
    "SEM_TRADING_SYMBOL": "RELIANCE",
    "SEM_CUSTOM_SYMBOL": "Reliance Industries",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 11536,
    "SEM_TRADING_SYMBOL": "TCS",
    "SEM_CUSTOM_SYMBOL": "Tata Consultancy Services",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 1333,
    "SEM_TRADING_SYMBOL": "HDFCBANK",
    "SEM_CUSTOM_SYMBOL": "HDFC Bank",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 1594,
    "SEM_TRADING_SYMBOL": "INFY",
    "SEM_CUSTOM_SYMBOL": "Infosys",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 4963,
    "SEM_TRADING_SYMBOL": "ICICIBANK",
    "SEM_CUSTOM_SYMBOL": "ICICI Bank",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 317,
    "SEM_TRADING_SYMBOL": "BHARTIARTL",
    "SEM_CUSTOM_SYMBOL": "Bharti Airtel",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 1660,
    "SEM_TRADING_SYMBOL": "ITC",
    "SEM_CUSTOM_SYMBOL": "ITC",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 3045,
    "SEM_TRADING_SYMBOL": "SBIN",
    "SEM_CUSTOM_SYMBOL": "State Bank of India",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 1922,
    "SEM_TRADING_SYMBOL": "LT",
    "SEM_CUSTOM_SYMBOL": "Larsen & Toubro",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  },
  {
    "exchangeSegment": "NSE_EQ",
    "securityId": 1808,
    "SEM_TRADING_SYMBOL": "KOTAKBANK",
    "SEM_CUSTOM_SYMBOL": "Kotak Mahindra Bank",
    "SEM_EXCH_INSTRUMENT_TYPE": "ES",
    "SEM_SERIES": "EQ"
  }
];

// Initialize the mapping service
symbolMappingService.initializeMapping([...SECURITY_DATA, ...ADDITIONAL_POPULAR_STOCKS]);