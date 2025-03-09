export interface CandleData {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// Generate mock data for testing
export function generateMockData(symbol: string, timeframe: string, count = 100): CandleData[] {
  const now = new Date()
  const data: CandleData[] = []

  // Set time increment based on timeframe
  let timeIncrement = 24 * 60 * 60 * 1000 // Default to 1 day

  switch (timeframe) {
    case "1m":
      timeIncrement = 60 * 1000
      break
    case "5m":
      timeIncrement = 5 * 60 * 1000
      break
    case "15m":
      timeIncrement = 15 * 60 * 1000
      break
    case "30m":
      timeIncrement = 30 * 60 * 1000
      break
    case "1H":
      timeIncrement = 60 * 60 * 1000
      break
    case "4H":
      timeIncrement = 4 * 60 * 60 * 1000
      break
    case "1W":
      timeIncrement = 7 * 24 * 60 * 60 * 1000
      break
  }

  // Set starting price and volatility based on symbol
  let basePrice = 150
  let volatility = 0.02 // Default volatility
  let trend = 0 // Default neutral trend

  switch (symbol) {
    case "AAPL":
      basePrice = 180
      volatility = 0.015
      trend = 0.001 // Slight uptrend
      break
    case "MSFT":
      basePrice = 350
      volatility = 0.018
      trend = 0.002 // Stronger uptrend
      break
    case "GOOGL":
      basePrice = 140
      volatility = 0.02
      trend = 0.0005 // Very slight uptrend
      break
    case "AMZN":
      basePrice = 170
      volatility = 0.025
      trend = 0.001 // Slight uptrend
      break
    case "META":
      basePrice = 450
      volatility = 0.03
      trend = -0.0005 // Very slight downtrend
      break
    case "TSLA":
      basePrice = 220
      volatility = 0.04 // High volatility
      trend = 0.001 // Slight uptrend
      break
    case "NVDA":
      basePrice = 800
      volatility = 0.035
      trend = 0.003 // Strong uptrend
      break
    case "JPM":
      basePrice = 180
      volatility = 0.012 // Low volatility
      trend = 0.0008 // Slight uptrend
      break
  }

  // Generate candles with realistic patterns
  let lastClose = basePrice

  // Add some randomness to create more realistic patterns
  const trendCycles = Math.floor(Math.random() * 3) + 2 // 2-4 trend cycles
  const cycleLength = Math.floor(count / trendCycles)

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = now.getTime() - i * timeIncrement

    // Determine current trend direction based on cycle
    const cyclePosition = Math.floor(i / cycleLength) % trendCycles
    const cycleTrend = cyclePosition % 2 === 0 ? trend : -trend

    // Generate random price movement with trend bias
    const randomFactor = (Math.random() - 0.5) * 2 // -1 to 1
    const changePercent = randomFactor * volatility + cycleTrend

    const open = lastClose
    const close = open * (1 + changePercent)

    // Generate high and low with more realistic ranges
    // Higher volatility during higher volume periods
    const volumeFactor = 0.5 + Math.random() * 0.5 // 0.5 to 1
    const highLowRange = open * volatility * volumeFactor

    const high = Math.max(open, close) + Math.random() * highLowRange
    const low = Math.min(open, close) - Math.random() * highLowRange

    // Generate volume with some correlation to price movement
    const priceChange = Math.abs(close - open) / open
    const volumeBase = Math.floor(Math.random() * 5000) + 5000
    const volume = Math.floor(volumeBase * (1 + priceChange * 10))

    data.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    })

    lastClose = close
  }

  return data
}

// Generate realistic order book data based on the last price
export function generateOrderBookData(lastPrice: number, depth = 5) {
  const asks = []
  const bids = []

  // Generate ask prices (sell orders) above the last price
  for (let i = 0; i < depth; i++) {
    const priceIncrement = Math.random() * 0.1 + i * 0.1
    const price = lastPrice + priceIncrement
    const size = Math.floor(Math.random() * 500) + 100
    asks.push({ price, size })
  }

  // Generate bid prices (buy orders) below the last price
  for (let i = 0; i < depth; i++) {
    const priceDecrement = Math.random() * 0.1 + i * 0.1
    const price = lastPrice - priceDecrement
    const size = Math.floor(Math.random() * 500) + 100
    bids.push({ price, size })
  }

  // Sort asks ascending and bids descending
  asks.sort((a, b) => a.price - b.price)
  bids.sort((a, b) => b.price - a.price)

  return { asks, bids }
}

