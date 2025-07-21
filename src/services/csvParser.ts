export interface SecurityData {
  securityId: string;
  tradingSymbol: string;
  customSymbol: string;
  exchangeSegment: string;
  instrumentType: string;
  series: string;
  lotSize?: number;
  tickSize?: number;
}

class CSVParserService {
  private securityData: Map<string, SecurityData> = new Map();
  private symbolToSecurityId: Map<string, string> = new Map();
  private searchIndex: SecurityData[] = [];

  async loadSecurityData(csvContent: string) {
    try {
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      // Find required column indices
      const securityIdIndex = headers.findIndex(h => 
        h.includes('SEM_SMST_SECURITY_ID') || h.includes('SECURITY_ID')
      );
      const tradingSymbolIndex = headers.findIndex(h => 
        h.includes('SEM_TRADING_SYMBOL') || h.includes('TRADING_SYMBOL')
      );
      const customSymbolIndex = headers.findIndex(h => 
        h.includes('SEM_CUSTOM_SYMBOL') || h.includes('CUSTOM_SYMBOL')
      );
      const exchangeIndex = headers.findIndex(h => 
        h.includes('SEM_EXM_EXCH_ID') || h.includes('EXCHANGE')
      );

      if (securityIdIndex === -1 || tradingSymbolIndex === -1) {
        throw new Error('Required columns not found in CSV');
      }

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map(cell => cell.trim().replace(/"/g, ''));
        
        if (row.length < headers.length) continue;

        const securityId = row[securityIdIndex];
        const tradingSymbol = row[tradingSymbolIndex];
        const customSymbol = row[customSymbolIndex] || tradingSymbol;
        const exchange = row[exchangeIndex] || 'NSE_EQ';

        if (securityId && tradingSymbol) {
          const security: SecurityData = {
            securityId,
            tradingSymbol,
            customSymbol,
            exchangeSegment: exchange,
            instrumentType: 'ES',
            series: 'EQ'
          };

          this.securityData.set(securityId, security);
          this.symbolToSecurityId.set(tradingSymbol.toUpperCase(), securityId);
          this.searchIndex.push(security);
        }
      }

      console.log(`Loaded ${this.securityData.size} securities from CSV`);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      throw error;
    }
  }

  getSecurityById(securityId: string): SecurityData | null {
    return this.securityData.get(securityId) || null;
  }

  getSecurityBySymbol(tradingSymbol: string): SecurityData | null {
    const securityId = this.symbolToSecurityId.get(tradingSymbol.toUpperCase());
    return securityId ? this.securityData.get(securityId) || null : null;
  }

  searchSecurities(query: string, limit: number = 20): SecurityData[] {
    const queryLower = query.toLowerCase();
    const results: SecurityData[] = [];

    for (const security of this.searchIndex) {
      if (results.length >= limit) break;

      if (
        security.tradingSymbol.toLowerCase().includes(queryLower) ||
        security.customSymbol.toLowerCase().includes(queryLower)
      ) {
        results.push(security);
      }
    }

    return results.sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.tradingSymbol.toLowerCase() === queryLower;
      const bExact = b.tradingSymbol.toLowerCase() === queryLower;
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then prioritize symbol matches over name matches
      const aSymbolMatch = a.tradingSymbol.toLowerCase().startsWith(queryLower);
      const bSymbolMatch = b.tradingSymbol.toLowerCase().startsWith(queryLower);
      
      if (aSymbolMatch && !bSymbolMatch) return -1;
      if (!aSymbolMatch && bSymbolMatch) return 1;
      
      return a.tradingSymbol.localeCompare(b.tradingSymbol);
    });
  }

  getPopularSecurities(): SecurityData[] {
    const popularSymbols = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
      'BHARTIARTL', 'ITC', 'SBIN', 'LT', 'KOTAKBANK'
    ];

    return popularSymbols
      .map(symbol => this.getSecurityBySymbol(symbol))
      .filter((security): security is SecurityData => security !== null);
  }

  getAllSecurities(): SecurityData[] {
    return Array.from(this.securityData.values());
  }
}

export const csvParserService = new CSVParserService();