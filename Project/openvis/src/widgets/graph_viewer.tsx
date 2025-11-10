"use client"

import z from "zod";
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
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { useGraph } from "@/features/topology/topology.ui";

export function GraphViewer() {
  const { svg_ref, controller } = useGraph();
  const [url, setUrl] = useState("http://localhost:8080");
  const [interval, setInterval] = useState("5000");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    const urlValidation = z.url().safeParse(url);
    if (!urlValidation.success) {
      toast.error("Invalid URL format");
      return;
    }

    const intervalNum = Number(interval);
    if (isNaN(intervalNum) || intervalNum < 1000) {
      toast.error("Polling interval must be at least 1000ms");
      return;
    }

    setIsConnecting(true);
    try {
      await controller.connect(url, intervalNum);
      // Clear form on success
      setUrl("");
      setInterval("5000");
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger className="relative overflow-hidden flex flex-1 text-sm">
        <svg ref={(element) => svg_ref.set(element)} className="w-full h-full" />
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
  )
}
