// Market hours utility for Indian stock market
export class MarketHours {
  private static MARKET_START_HOUR = 9;
  private static MARKET_START_MINUTE = 15;
  private static MARKET_END_HOUR = 15;
  private static MARKET_END_MINUTE = 30;

  // Check if current time is within market hours (IST)
  static isMarketOpen(): boolean {
    const now = new Date();
    
    // Convert to IST (UTC+5:30)
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    
    const currentHour = istTime.getUTCHours();
    const currentMinute = istTime.getUTCMinutes();
    const currentDay = istTime.getUTCDay(); // 0 = Sunday, 6 = Saturday
    
    // Check if it's a weekday (Monday to Friday)
    if (currentDay === 0 || currentDay === 6) {
      return false;
    }
    
    // Check if current time is within market hours
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    const marketStartInMinutes = this.MARKET_START_HOUR * 60 + this.MARKET_START_MINUTE;
    const marketEndInMinutes = this.MARKET_END_HOUR * 60 + this.MARKET_END_MINUTE;
    
    return currentTimeInMinutes >= marketStartInMinutes && currentTimeInMinutes <= marketEndInMinutes;
  }

  // Get market status message
  static getMarketStatus(): string {
    if (this.isMarketOpen()) {
      return 'Market Open';
    }
    
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    const currentDay = istTime.getUTCDay();
    
    if (currentDay === 0 || currentDay === 6) {
      return 'Market Closed - Weekend';
    }
    
    return 'Market Closed';
  }

  // Get next market open time
  static getNextMarketOpen(): Date {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    
    let nextOpen = new Date(istTime);
    nextOpen.setUTCHours(this.MARKET_START_HOUR, this.MARKET_START_MINUTE, 0, 0);
    
    // If market hasn't opened today, return today's opening time
    if (istTime.getUTCHours() < this.MARKET_START_HOUR || 
        (istTime.getUTCHours() === this.MARKET_START_HOUR && istTime.getUTCMinutes() < this.MARKET_START_MINUTE)) {
      // Check if it's a weekday
      if (istTime.getUTCDay() >= 1 && istTime.getUTCDay() <= 5) {
        return new Date(nextOpen.getTime() - (5.5 * 60 * 60 * 1000)); // Convert back to local time
      }
    }
    
    // Otherwise, find next weekday
    do {
      nextOpen.setUTCDate(nextOpen.getUTCDate() + 1);
    } while (nextOpen.getUTCDay() === 0 || nextOpen.getUTCDay() === 6);
    
    nextOpen.setUTCHours(this.MARKET_START_HOUR, this.MARKET_START_MINUTE, 0, 0);
    
    return new Date(nextOpen.getTime() - (5.5 * 60 * 60 * 1000)); // Convert back to local time
  }
}