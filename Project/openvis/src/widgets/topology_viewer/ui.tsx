"use client"

import { cn } from "@/shared/lib/utils"
import { useGraph } from "./context";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/shared/ui/context-menu"
import { Slider } from "@/shared/ui/slider";
import { Label } from "@/shared/ui/label";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { useState } from "react";
import { check_floodlight } from "@/features/topology/floodlight/check";
import { toast } from "sonner";

export function TopologyViewer() {
  const { svgRef, nodes, links, simulation } = useGraph()
  const [controllerUrl, setControllerUrl] = useState("http://localhost:8080")
  const [pollingInterval, setPollingInterval] = useState("5000")

  const handleConnect = async () => {
    try {
      const isHealthy = await check_floodlight(controllerUrl)

      // if (isHealthy) {
      //   const controllerId = `floodlight-${Date.now()}`
      //   setTimeout(() => {
      //     setIsDialogOpen(false)
      //     setControllerUrl("http://localhost:8080")
      //     setPollingInterval("5000")
      //     setHealthStatus("idle")
      //   }, 1000)
      // } else {
      //   setHealthStatus("error")
      // }
    } catch (error) {
      toast("Health check failed")
    }
  }

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
                          value={controllerUrl}
                          onChange={(e) => setControllerUrl(e.target.value)}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="polling-interval">Polling Interval (ms)</Label>
                        <Input
                          id="polling-interval"
                          type="number"
                          placeholder="5000"
                          value={pollingInterval}
                          onChange={(e) => setPollingInterval(e.target.value)}
                        />
                      </div>
                      <Button onClick={handleConnect}>
                        Connect
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

//       {healthStatus === "checking" && (
//         <div className="text-sm text-muted-foreground">
//           Checking controller health...
//         </div>
//       )}
//
//       {healthStatus === "success" && (
//         <div className="text-sm text-green-600">
//           ✓ Controller is healthy! Connecting...
//         </div>
//       )}
//
//       {healthStatus === "error" && (
//         <div className="text-sm text-red-600">
//           ✗ {errorMessage}
//         </div>
//       )}
//     </div>

export function ForceStrengthControls() {
  const { forceStrength } = useGraph();

  return (
    <div className="flex flex-col w-full gap-2 overflow-hidden rounded-md p-2 ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0">
      <div className="flex items-center justify-between">
        <Label htmlFor="force-strength">Force Strength</Label>
        <span className="text-sm text-muted-foreground">{forceStrength.value}</span>
      </div>
      <Slider
        id="force-strength"
        min={0}
        max={1}
        step={0.01}
        defaultValue={[forceStrength.value]}
        onValueChange={([value]) => forceStrength.set(value)}
      />
      <p className="text-xs text-muted-foreground">
        Controls centering force intensity
      </p>
    </div>
  );
}

export function LinkDistanceControls() {
  const { linkDistance } = useGraph();

  return (
    <div className="flex flex-col w-full gap-2 overflow-hidden rounded-md p-2 ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0">
      <div className="flex items-center justify-between">
        <Label htmlFor="link-distance">Link Distance</Label>
        <span className="text-sm text-muted-foreground">{linkDistance.value}</span>
      </div>
      <Slider
        id="link-distance"
        min={50}
        max={300}
        step={10}
        defaultValue={[linkDistance.value]}
        onValueChange={([value]) => linkDistance.set(value)}
      />
      <p className="text-xs text-muted-foreground">
        Distance between connected nodes
      </p>
    </div>
  );
}

export function ChargeStrengthControls() {
  const { chargeStrength } = useGraph();

  return (
    <div className="flex flex-col w-full gap-2 overflow-hidden rounded-md p-2 ring-sidebar-ring transition-[width,height,padding] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0">
      <div className="flex items-center justify-between text-sm">
        <Label htmlFor="charge-strength">Charge Strength</Label>
        <span className="text-sm text-muted-foreground">{chargeStrength.value}</span>
      </div>
      <Slider
        id="charge-strength"
        min={-500}
        max={-100}
        step={25}
        defaultValue={[chargeStrength.value]}
        onValueChange={([value]) => chargeStrength.set(value)}
      />
      <p className="text-xs text-muted-foreground">
        Repulsion force between nodes
      </p>
    </div>
  );
}
