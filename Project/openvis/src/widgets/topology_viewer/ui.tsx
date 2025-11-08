"use client"

import { cn } from "@/shared/lib/utils"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu"
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useTopologyViewer } from "./context";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import z from "zod";

export function TopologyViewer() {
  const { setSvgRef, connectController } = useTopologyViewer();
  const svgRef = useRef<SVGSVGElement>(null);
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState("5000");
  const [isConnecting, setIsConnecting] = useState(false);

  // Pass SVG ref to context
  useEffect(() => {
    if (svgRef.current) {
      setSvgRef(svgRef);
    }
  }, [setSvgRef]);

  // Handle connect button click
  const handleConnect = async () => {
    // Validate URL
    const urlValidation = z.string().url().safeParse(url);
    if (!urlValidation.success) {
      toast.error("Invalid URL format");
      return;
    }

    // Validate interval
    const intervalNum = Number(interval);
    if (isNaN(intervalNum) || intervalNum < 1000) {
      toast.error("Polling interval must be at least 1000ms");
      return;
    }

    setIsConnecting(true);
    try {
      await connectController(url, intervalNum);
      // Clear form on success
      setUrl("");
      setInterval("5000");
    } catch (error) {
      // Error already toasted by connectController
      console.error("Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-center gap-2 p-2">
      <div className="bg-muted/50 border rounded-lg flex flex-1"  >
        <ContextMenu>
          <ContextMenuTrigger className="relative overflow-hidden flex flex-1 text-sm">
            <svg ref={svgRef} className="w-full h-full" />
            <div className="absolute bottom-2 left-2 py-1 px-2 bg-background/90 backdrop-blur rounded-lg border text-sm">
              <div className="flex items-center gap-4">
                {(() => {
                  const item_classname = "flex items-center gap-2 text-xs"
                  const indicator_classname = "size-2 rounded-full border"
                  return (
                    <>
                      <div className={cn(item_classname)}>
                        <div className={cn(indicator_classname, "bg-green-500")} />
                        <span>controller</span>
                      </div>
                      <div className={cn(item_classname)}>
                        <div className={cn(indicator_classname, "bg-blue-500")} />
                        <span>switch</span>
                      </div>
                      <div className={cn(item_classname)}>
                        <div className={cn(indicator_classname, "bg-purple-500")} />
                        <span>host</span>
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuSub>
              <ContextMenuSubTrigger>Add controller</ContextMenuSubTrigger>
              <ContextMenuSubContent>
                <ContextMenuSub>
                  <ContextMenuSubTrigger>Floodlight</ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <div className="flex flex-col gap-4 px-2 py-1.5 text-sm outline-hidden">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="controller-url">Controller URL</Label>
                        <Input
                          id="controller-url"
                          placeholder="http://localhost:8080"
                          value={url}
                          onChange={(e) => setUrl(e.target.value)}
                          disabled={isConnecting}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="polling-interval">Polling Interval (ms)</Label>
                        <Input
                          id="polling-interval"
                          type="number"
                          placeholder="5000"
                          value={interval}
                          onChange={(e) => setInterval(e.target.value)}
                          disabled={isConnecting}
                        />
                      </div>
                      <Button onClick={handleConnect} disabled={isConnecting}>
                        {isConnecting ? "Connecting..." : "Connect"}
                      </Button>
                    </div>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              </ContextMenuSubContent>
            </ContextMenuSub>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      <div className="flex justify-center p-2 bg-muted/50 border rounded-lg">
        <div>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Drag nodes to reposition • Scroll to zoom • Drag background to pan
          </p>
        </div>
      </div>

    </div >
  )
}
