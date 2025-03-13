"use client";

import { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DrawingToolbar from "@/components/drawing-toolbar";

interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  data: CandleData[];
  symbol: string;
  timeframe: string;
}

export default function StockChart({
  data,
  symbol,
  timeframe,
}: StockChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDrawingTool, setActiveDrawingTool] = useState<string | null>(
    null
  );
  const [drawings, setDrawings] = useState<any[]>([]);
  const [chartMode, setChartMode] = useState("candle");
  const scaleRef = useRef(null);
  const dimensionRef = useRef(null);
  const chartElementsRef = useRef(null);
  const zoomRef = useRef(null);
  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(
    null
  );
  const [currentPoint, setCurrentPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  
  const yAxisRef = useRef(null);

 // Main chart rendering useEffect - focused on data and container dimensions
useEffect(() => {
  if (!data.length || !svgRef.current || !containerRef.current) return;

  const margin = { top: 20, right: 30, bottom: 30, left: 60 };
  const width = containerRef.current.clientWidth - margin.left - margin.right;
  const height =
    containerRef.current.clientHeight - margin.top - margin.bottom - 40; // Account for toolbar

  // Clear previous chart
  d3.select(svgRef.current).selectAll("*").remove();

  // Create the main SVG with fixed dimensions
  const svg = d3
    .select(svgRef.current)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

  // Create a clipping path to ensure content stays within bounds
  svg
    .append("defs")
    .append("clipPath")
    .attr("id", "chart-area")
    .append("rect")
    .attr("width", width)
    .attr("height", height);

  // Create a group for the chart content that will be zoomed
  const chartGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("clip-path", "url(#chart-area)");

  // Create groups for different chart elements
  const xAxisGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${height + margin.top})`)
    .attr("class", "x-axis");

  const yAxisGroup = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("class", "y-axis");

  const gridGroup = chartGroup.append("g").attr("class", "grid");
  const volumeGroup = chartGroup.append("g").attr("class", "volume");
  const candleGroup = chartGroup.append("g").attr("class", "candles");
  const lineGroup = chartGroup.append("g").attr("class", "line");
  const drawingGroup = chartGroup.append("g").attr("class", "drawings");
  const annotationGroup = chartGroup.append("g").attr("class", "annotations");

  // X scale with extra padding for zoom
  const xExtent = [data[0].timestamp, data[data.length - 1].timestamp];
  const xRange = xExtent[1] - xExtent[0];
  const xPadding = xRange * 0.1; // 10% padding

  const x = d3
    .scaleTime()
    .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
    .range([0, width]);

  // Calculate band width for candlesticks
  const bandWidth = (width / data.length) * 0.8;

  // Y scale
  const minLow = d3.min(data, (d) => d.low) ?? 0;
  const maxHigh = d3.max(data, (d) => d.high) ?? 0;
  const yExtent = [minLow * 0.999, maxHigh * 1.001];
  console.log(yExtent);

  const y = d3.scaleLinear().domain(yExtent).range([height, 0]);

  // X axis
  const xAxis = d3.axisBottom(x).tickFormat((d: any) => {
    const date = new Date(d);
    return formatDateByTimeframe(date, timeframe);
  });

  xAxisGroup.call(xAxis);

  // Y axis
  const yAxis: d3.Axis<d3.NumberValue> = d3
    .axisLeft(y)
    .tickFormat((d: d3.NumberValue) => `$${d.valueOf().toFixed(2)}`);

  yAxisGroup.call(yAxis);

  // Add grid lines
  gridGroup
    .call(
      d3
        .axisLeft(y)
        .tickSize(-width)
        .tickFormat(() => "")
    )
    .attr("opacity", 0.1);

  // Draw volume bars at the bottom
  const volumeHeight = height * 0.1;
  const yVolume = d3
    .scaleLinear()
    .domain([0, (d3.max(data, (d) => d.volume) ?? 0) * 1.1])
    .range([height, height - volumeHeight]);

  volumeGroup
    .selectAll(".volume-bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", "volume-bar")
    .attr("x", (d) => x(d.timestamp) - bandWidth / 2)
    .attr("y", (d) => yVolume(d.volume))
    .attr("width", bandWidth)
    .attr("height", (d) => height - yVolume(d.volume))
    .attr("fill", (d) =>
      d.open > d.close ? "rgba(239, 68, 68, 0.3)" : "rgba(34, 197, 94, 0.3)"
    );

  // Store scales and dimensions in refs for other useEffects to access
  scaleRef.current = { x, y, bandWidth };
  dimensionRef.current = { width, height, margin };
  chartElementsRef.current = {
    svg,
    chartGroup,
    xAxisGroup,
    yAxisGroup,
    volumeGroup,
    candleGroup,
    lineGroup,
    drawingGroup,
    annotationGroup,
  };
  
  // Implement zoom functionality
  const zoom = d3
    .zoom()
    .scaleExtent([0.5, 10]) // Allow zoom from 0.5x to 10x
    .extent([
      [0, 0],
      [width, height],
    ])
    .on("zoom", handleZoom);

  // Apply zoom behavior to the SVG
  svg.call(zoom);
  zoomRef.current = zoom;

  // Add price label for the last candle
  if (data.length > 0) {
    const lastCandle = data[data.length - 1];
    annotationGroup
      .append("rect")
      .attr("x", width - 70)
      .attr("y", 10)
      .attr("width", 70)
      .attr("height", 24)
      .attr("fill", "rgba(0, 0, 0, 0.5)")
      .attr("rx", 4);

    annotationGroup
      .append("text")
      .attr("x", width - 35)
      .attr("y", 26)
      .attr("text-anchor", "middle")
      .attr(
        "fill",
        lastCandle.close > lastCandle.open
          ? "rgb(34, 197, 94)"
          : "rgb(239, 68, 68)"
      )
      .attr("font-weight", "bold")
      .text(`$${lastCandle.close.toFixed(2)}`);
  }

  // Set up event listeners for zoom buttons
  const zoomIn = () => {
    svg.transition().call(zoom.scaleBy, 1.2);
  };

  const zoomOut = () => {
    svg.transition().call(zoom.scaleBy, 0.8);
  };

  const resetZoom = () => {
    svg.transition().call(zoom.transform, d3.zoomIdentity);
  };

  document.addEventListener("chart-zoom-in", zoomIn);
  document.addEventListener("chart-zoom-out", zoomOut);
  document.addEventListener("chart-reset-zoom", resetZoom);

  return () => {
    document.removeEventListener("chart-zoom-in", zoomIn);
    document.removeEventListener("chart-zoom-out", zoomOut);
    document.removeEventListener("chart-reset-zoom", resetZoom);
  };
}, [data, timeframe]); // Only depends on data and timeframe

// Separate useEffect for chart mode (candle vs line)
useEffect(() => {
  if (!data.length || !chartElementsRef.current || !scaleRef.current) return;
  
  const { x, y, bandWidth } = scaleRef.current;
  const { candleGroup, lineGroup } = chartElementsRef.current;
  
  // Clear previous chart elements
  candleGroup.selectAll("*").remove();
  lineGroup.selectAll("*").remove();
  
  if (chartMode === "candle") {
    // Draw candlesticks
    candleGroup
      .selectAll(".candle")
      .data(data)
      .enter()
      .append("rect")
      .attr("class", "candle")
      .attr("x", (d) => x(d.timestamp) - bandWidth / 2)
      .attr("y", (d) => (d.open > d.close ? y(d.open) : y(d.close)))
      .attr("width", bandWidth)
      .attr("height", (d) =>
        d.open > d.close ? y(d.close) - y(d.open) : y(d.open) - y(d.close)
      )
      .attr("fill", (d) =>
        d.open > d.close ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)"
      );

    // Draw high-low lines
    candleGroup
      .selectAll(".high-low-line")
      .data(data)
      .enter()
      .append("line")
      .attr("class", "high-low-line")
      .attr("x1", (d) => x(d.timestamp))
      .attr("x2", (d) => x(d.timestamp))
      .attr("y1", (d) => y(d.high))
      .attr("y2", (d) => y(d.low))
      .attr("stroke", (d) =>
        d.open > d.close ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)"
      )
      .attr("stroke-width", 1);
  } else if (chartMode === "line") {
    // Draw line chart
    const line = d3
      .line<CandleData>()
      .x((d) => x(d.timestamp))
      .y((d) => y(d.close));

    lineGroup
      .append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "rgb(59, 130, 246)")
      .attr("stroke-width", 1.5)
      .attr("d", line);

    // Add dots for data points
    lineGroup
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("cx", (d) => x(d.timestamp))
      .attr("cy", (d) => y(d.close))
      .attr("r", 2)
      .attr("fill", "rgb(59, 130, 246)");
  }
}, [chartMode, data]); // Only depends on chartMode and data

// Separate useEffect for drawings
useEffect(() => {
  if (!chartElementsRef.current || !dimensionRef.current) return;
  
  const { drawingGroup } = chartElementsRef.current;
  const { width } = dimensionRef.current;
  
  // Clear previous drawings
  drawingGroup.selectAll("*").remove();
  
  // Draw existing drawings
  drawings.forEach((drawing) => {
    if (drawing.type === "trendline") {
      drawingGroup
        .append("line")
        .attr("x1", drawing.start.x)
        .attr("y1", drawing.start.y)
        .attr("x2", drawing.end.x)
        .attr("y2", drawing.end.y)
        .attr("stroke", "white")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5");
    } else if (drawing.type === "horizontalLine") {
      drawingGroup
        .append("line")
        .attr("x1", 0)
        .attr("y1", drawing.y)
        .attr("x2", width)
        .attr("y2", drawing.y)
        .attr("stroke", "yellow")
        .attr("stroke-width", 2);
    } else if (drawing.type === "fibRetracement") {
      const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
      const [startY, endY] = [drawing.start.y, drawing.end.y].sort(
        (a, b) => a - b
      );
      const range = endY - startY;

      levels.forEach((level) => {
        const y = startY + range * level;
        drawingGroup
          .append("line")
          .attr("x1", 0)
          .attr("y1", y)
          .attr("x2", width)
          .attr("y2", y)
          .attr("stroke", "rgba(147, 197, 253, 0.8)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "3,3");

        drawingGroup
          .append("text")
          .attr("x", width - 5)
          .attr("y", y - 5)
          .attr("text-anchor", "end")
          .attr("fill", "white")
          .attr("font-size", "10px")
          .text(`${(level * 100).toFixed(1)}%`);
      });
    } else if (drawing.type === "point") {
      // Draw points marked with the pencil tool
      drawingGroup
        .append("circle")
        .attr("cx", drawing.x)
        .attr("cy", drawing.y)
        .attr("r", 5)
        .attr("fill", "rgba(255, 255, 255, 0.8)")
        .attr("stroke", "white")
        .attr("stroke-width", 1);

      // Add label if provided
      if (drawing.label) {
        drawingGroup
          .append("text")
          .attr("x", drawing.x + 8)
          .attr("y", drawing.y - 8)
          .attr("fill", "white")
          .attr("font-size", "10px")
          .text(drawing.label);
      }
    }
  });
}, [drawings]); // Only depends on drawings array

// Separate useEffect for active drawing state
useEffect(() => {
  if (!chartElementsRef.current || !dimensionRef.current) return;
  if (!isDrawing || !startPoint || !currentPoint) return;
  
  const { drawingGroup } = chartElementsRef.current;
  const { width } = dimensionRef.current;
  
  // Clear temporary drawings
  drawingGroup.selectAll(".temp-drawing").remove();
  
  if (activeDrawingTool === "trendline") {
    drawingGroup
      .append("line")
      .attr("class", "temp-drawing")
      .attr("x1", startPoint.x)
      .attr("y1", startPoint.y)
      .attr("x2", currentPoint.x)
      .attr("y2", currentPoint.y)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5");
  } else if (activeDrawingTool === "fibRetracement") {
    const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
    const [startY, endY] = [startPoint.y, currentPoint.y].sort(
      (a, b) => a - b
    );
    const range = endY - startY;

    levels.forEach((level) => {
      const y = startY + range * level;
      drawingGroup
        .append("line")
        .attr("class", "temp-drawing")
        .attr("x1", 0)
        .attr("y1", y)
        .attr("x2", width)
        .attr("y2", y)
        .attr("stroke", "rgba(147, 197, 253, 0.8)")
        .attr("stroke-width", 1)
        .attr("stroke-dasharray", "3,3");
    });
  }
}, [isDrawing, startPoint, currentPoint, activeDrawingTool]); // Only depends on drawing state

// Separate useEffect for mouse event listeners
useEffect(() => {
  if (!svgRef.current) return;

  const svgElement = svgRef.current;
  const { margin } = dimensionRef.current || { margin: { top: 20, left: 60 } };
  const { y } = scaleRef.current || { y: null };

  const handleMouseDown = (e) => {
    if (!activeDrawingTool) return;

    const rect = svgElement.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const y = e.clientY - rect.top - margin.top;

    setIsDrawing(true);
    setStartPoint({ x, y });
    setCurrentPoint({ x, y });
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const rect = svgElement.getBoundingClientRect();
    const x = e.clientX - rect.left - margin.left;
    const y = e.clientY - rect.top - margin.top;

    setCurrentPoint({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !startPoint || !currentPoint) return;

    if (activeDrawingTool === "trendline") {
      setDrawings([
        ...drawings,
        {
          type: "trendline",
          start: startPoint,
          end: currentPoint,
        },
      ]);
    } else if (activeDrawingTool === "horizontalLine") {
      setDrawings([
        ...drawings,
        {
          type: "horizontalLine",
          y: startPoint.y,
        },
      ]);
    } else if (activeDrawingTool === "fibRetracement") {
      setDrawings([
        ...drawings,
        {
          type: "fibRetracement",
          start: startPoint,
          end: currentPoint,
        },
      ]);
    } else if (activeDrawingTool === "pencil") {
      // For pencil tool, add a point at the current position
      // Calculate the timestamp at this x position
      const { width } = dimensionRef.current;
      const xScale = d3
        .scaleLinear()
        .domain([0, width])
        .range([0, data.length - 1]);

      const dataIndex = Math.round(xScale(startPoint.x));
      const timestamp =
        dataIndex >= 0 && dataIndex < data.length
          ? data[dataIndex].timestamp
          : null;

      // Get the price at this y position
      const price = y ? y.invert(startPoint.y) : 0;

      setDrawings([
        ...drawings,
        {
          type: "point",
          x: startPoint.x,
          y: startPoint.y,
          dataIndex,
          timestamp,
          price,
          label: `$${price.toFixed(2)}`,
        },
      ]);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoint(null);
  };

  svgElement.addEventListener("mousedown", handleMouseDown);
  svgElement.addEventListener("mousemove", handleMouseMove);
  svgElement.addEventListener("mouseup", handleMouseUp);

  return () => {
    svgElement.removeEventListener("mousedown", handleMouseDown);
    svgElement.removeEventListener("mousemove", handleMouseMove);
    svgElement.removeEventListener("mouseup", handleMouseUp);
  };
}, [activeDrawingTool, isDrawing, startPoint, currentPoint, drawings, data]); // Only depends on drawing-related state

// Zoom event handler function
const handleZoom = (event:any) => {
  if (!chartElementsRef.current || !scaleRef.current || !dimensionRef.current) return;
  
  const { chartGroup, xAxisGroup, volumeGroup, candleGroup, lineGroup } = chartElementsRef.current;
  const { x, bandWidth } = scaleRef.current;
  const { margin } = dimensionRef.current;
  
  // Update the transform of the chart group
  chartGroup.attr(
    "transform",
    `translate(${margin.left + event.transform.x},${margin.top}) scale(${
      event.transform.k
    }, 1)`
  );

  // Update the x-axis with the new transform
  const newX = event.transform.rescaleX(x);
  const xAxis = d3.axisBottom(newX).tickFormat((d) => {
    const date = new Date(d);
    return formatDateByTimeframe(date, timeframe);
  });
  
  xAxisGroup.call(xAxis);

  // Update positions of all elements based on the new scale
  volumeGroup
    .selectAll(".volume-bar")
    .attr(
      "x",
      (d) => newX(d.timestamp) - (bandWidth * event.transform.k) / 2
    )
    .attr("width", bandWidth * event.transform.k);

  if (chartMode === "candle") {
    candleGroup
      .selectAll(".candle")
      .attr(
        "x",
        (d) => newX(d.timestamp) - (bandWidth * event.transform.k) / 2
      )
      .attr("width", bandWidth * event.transform.k);

    candleGroup
      .selectAll(".high-low-line")
      .attr("x1", (d) => newX(d.timestamp))
      .attr("x2", (d) => newX(d.timestamp));
  } else if (chartMode === "line") {
    // Update line path
    const { y } = scaleRef.current;
    const newLine = d3
      .line()
      .x((d) => newX(d.timestamp))
      .y((d) => y(d.close));

    lineGroup.select("path").attr("d", newLine(data));

    // Update dots
    lineGroup.selectAll(".dot").attr("cx", (d) => newX(d.timestamp));
  }
};

  const handleClearDrawings = () => {
    setDrawings([]);
  };

  // Helper function to format dates based on timeframe
  const formatDateByTimeframe = (date: Date, timeframe: string) => {
    switch (timeframe) {
      case "1m":
      case "5m":
      case "15m":
      case "30m":
        return `${date.getHours().toString().padStart(2, "0")}:${date
          .getMinutes()
          .toString()
          .padStart(2, "0")}`;
      case "1H":
      case "4H":
        return `${date.getMonth() + 1}/${date.getDate()} ${date
          .getHours()
          .toString()
          .padStart(2, "0")}:00`;
      case "1D":
        return `${date.getMonth() + 1}/${date.getDate()}`;
      case "1W":
        return `${date.getMonth() + 1}/${date.getDate()}/${date
          .getFullYear()
          .toString()
          .substr(2, 2)}`;
      default:
        return date.toLocaleDateString();
    }
  };

  return (
    <div className="flex flex-col h-full" ref={containerRef}>
      <div className="flex justify-between items-center p-2 border-b">
        <div className="flex items-center">
          <h2 className="text-lg font-bold mr-2">{symbol}</h2>
          <span className="text-sm text-muted-foreground">{timeframe}</span>
          {data.length > 0 && (
            <span
              className={`ml-4 font-mono ${
                data[data.length - 1].close > data[data.length - 1].open
                  ? "text-green-500"
                  : "text-red-500"
              }`}
            >
              ${data[data.length - 1].close.toFixed(2)}
            </span>
          )}
        </div>

        <Tabs defaultValue="candle" onValueChange={setChartMode}>
          <TabsList>
            <TabsTrigger value="candle">Candlestick</TabsTrigger>
            <TabsTrigger value="line">Line</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="relative flex-1">
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>

      <DrawingToolbar
        activeTool={activeDrawingTool}
        onSelectTool={setActiveDrawingTool}
        onClearDrawings={handleClearDrawings}
      />
    </div>
  );
}
