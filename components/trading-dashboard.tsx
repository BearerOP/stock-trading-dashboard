"use client"

import { useState, useEffect } from "react"
import StockChart from "@/components/stock-chart"
import SymbolSelector from "@/components/symbol-selector"
import TimeframeSelector from "@/components/timeframe-selector"
import { Card, CardContent } from "@/components/ui/card"
import { generateMockData } from "@/lib/mock-data"

export default function TradingDashboard() {
  const [symbol, setSymbol] = useState("AAPL")
  const [timeframe, setTimeframe] = useState("1D")
  const [stockData, setStockData] = useState<{ timestamp: number; open: number; high: number; low: number; close: number; volume: number }[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Simulate WebSocket connection and data streaming
  useEffect(() => {
    // Generate initial historical data
    const initialData = generateMockData(symbol, timeframe, 100)
    setStockData(initialData)
    setIsConnected(true)

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (stockData.length > 0) {
        // Get the last candle
        const lastCandle = stockData[stockData.length - 1]

        // Generate a new candle based on the last one
        const changePercent = (Math.random() - 0.5) * 0.005 // Small random change
        const close = lastCandle.close * (1 + changePercent)
        const open = lastCandle.close
        const highLowRange = open * 0.005
        const high = Math.max(open, close) + Math.random() * highLowRange
        const low = Math.min(open, close) - Math.random() * highLowRange
        const volume = Math.floor(Math.random() * 5000) + 500

        // Create timestamp based on timeframe
        let timeIncrement
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
          case "1D":
            timeIncrement = 24 * 60 * 60 * 1000
            break
          case "1W":
            timeIncrement = 7 * 24 * 60 * 60 * 1000
            break
          default:
            timeIncrement = 24 * 60 * 60 * 1000
        }

        const newCandle = {
          timestamp: lastCandle.timestamp + timeIncrement,
          open,
          high,
          low,
          close,
          volume,
        }

        // Update the last candle with new data (simulating real-time updates)
        const updatedData = [...stockData]
        updatedData[updatedData.length - 1] = {
          ...lastCandle,
          close,
          high: Math.max(lastCandle.high, high),
          low: Math.min(lastCandle.low, low),
        }

        // Every 10 updates, add a new candle
        if (Math.random() > 0.9) {
          updatedData.push(newCandle)
          // Remove oldest candle if we have too many
          if (updatedData.length > 100) {
            updatedData.shift()
          }
        }

        setStockData(updatedData)
      }
    }, 1000) // Update every second

    return () => {
      clearInterval(interval)
      setIsConnected(false)
    }
  }, [symbol, timeframe])

  // When symbol or timeframe changes, generate new data
  useEffect(() => {
    const newData = generateMockData(symbol, timeframe, 100)
    setStockData(newData)
  }, [symbol, timeframe])

  return (
    <div className="flex flex-col w-full h-screen p-4 bg-background">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Trading Dashboard</h1>
        <div className="flex items-center space-x-4">
          <SymbolSelector value={symbol} onChange={setSymbol} />
          <TimeframeSelector value={timeframe} onChange={setTimeframe} />
          <div className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 flex-1">
        <Card className="lg:col-span-3 h-full">
          <CardContent className="p-0 h-full">
            <StockChart data={stockData} symbol={symbol} timeframe={timeframe} />
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Market Overview</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>S&P 500</span>
                  <span className="text-green-500">+1.2%</span>
                </div>
                <div className="flex justify-between">
                  <span>NASDAQ</span>
                  <span className="text-green-500">+0.8%</span>
                </div>
                <div className="flex justify-between">
                  <span>DOW</span>
                  <span className="text-red-500">-0.3%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <h2 className="text-lg font-semibold mb-2">Order Book</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price</span>
                  <span className="text-muted-foreground">Size</span>
                </div>
                {stockData.length > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-red-500">${(stockData[stockData.length - 1].close + 0.25).toFixed(2)}</span>
                      <span>{Math.floor(Math.random() * 200) + 100}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-500">${(stockData[stockData.length - 1].close + 0.15).toFixed(2)}</span>
                      <span>{Math.floor(Math.random() * 300) + 200}</span>
                    </div>
                    <div className="border-t my-2"></div>
                    <div className="flex justify-between">
                      <span className="text-green-500">
                        ${(stockData[stockData.length - 1].close - 0.1).toFixed(2)}
                      </span>
                      <span>{Math.floor(Math.random() * 250) + 150}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-500">
                        ${(stockData[stockData.length - 1].close - 0.2).toFixed(2)}
                      </span>
                      <span>{Math.floor(Math.random() * 400) + 300}</span>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

