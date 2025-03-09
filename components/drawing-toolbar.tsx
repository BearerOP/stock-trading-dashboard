"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LineChart, ArrowRightLeft, Minus, Circle, Square, Text, Trash2, Ruler, Pencil } from "lucide-react"

interface DrawingToolbarProps {
  activeTool: string | null
  onSelectTool: (tool: string | null) => void
  onClearDrawings: () => void
}

export default function DrawingToolbar({ activeTool, onSelectTool, onClearDrawings }: DrawingToolbarProps) {
  const tools = [
    { id: "trendline", icon: <LineChart size={16} />, label: "Trend Line" },
    { id: "horizontalLine", icon: <Minus size={16} />, label: "Horizontal Line" },
    { id: "verticalLine", icon: <Ruler size={16} className="rotate-90" />, label: "Vertical Line" },
    { id: "fibRetracement", icon: <ArrowRightLeft size={16} />, label: "Fibonacci Retracement" },
    { id: "pencil", icon: <Pencil size={16} />, label: "Point Marker" },
    { id: "circle", icon: <Circle size={16} />, label: "Circle" },
    { id: "rectangle", icon: <Square size={16} />, label: "Rectangle" },
    { id: "text", icon: <Text size={16} />, label: "Text" },
  ]

  return (
    <div className="flex items-center p-2 border-t bg-muted/30">
      <TooltipProvider>
        <div className="flex space-x-1">
          {tools.map((tool) => (
            <Tooltip key={tool.id}>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === tool.id ? "secondary" : "ghost"}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onSelectTool(activeTool === tool.id ? null : tool.id)}
                >
                  {tool.icon}
                  <span className="sr-only">{tool.label}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tool.label}</p>
              </TooltipContent>
            </Tooltip>
          ))}

          <div className="border-l mx-1 h-8"></div>

          {/* Add zoom controls */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => document.dispatchEvent(new Event("chart-zoom-in"))}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="11" y1="8" x2="11" y2="14"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                <span className="sr-only">Zoom In</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom In</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => document.dispatchEvent(new Event("chart-zoom-out"))}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  <line x1="8" y1="11" x2="14" y2="11"></line>
                </svg>
                <span className="sr-only">Zoom Out</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom Out</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => document.dispatchEvent(new Event("chart-reset-zoom"))}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                <span className="sr-only">Reset View</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset View</p>
            </TooltipContent>
          </Tooltip>

          <div className="border-l mx-1 h-8"></div>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={onClearDrawings}
              >
                <Trash2 size={16} />
                <span className="sr-only">Clear All</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Clear All Drawings</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    </div>
  )
}

