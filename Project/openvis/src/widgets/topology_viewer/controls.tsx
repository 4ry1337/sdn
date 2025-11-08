'use client';

import { useTopologyViewer } from "./context";
import { Label } from "@/shared/ui/label";
import { Slider } from "@/shared/ui/slider";
import { Checkbox } from "@/shared/ui/checkbox";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Separator } from "@/shared/ui/separator";

export function TopologyControls() {
  const {
    controllers,
    simulationParams,
    filters,
    updateSimulationParams,
    toggleFilter,
    resetSimulationParams,
    disconnectController,
    retryController,
  } = useTopologyViewer();

  const controllersList = Array.from(controllers.values());

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Connected Controllers Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Connected Controllers</h3>
        {controllersList.length === 0 ? (
          <p className="text-xs text-muted-foreground">No controllers connected</p>
        ) : (
          <div className="flex flex-col gap-2">
            {controllersList.map((controller) => (
              <div
                key={controller.url}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card"
              >
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        controller.status === 'connected'
                          ? 'default'
                          : controller.status === 'connecting'
                          ? 'outline'
                          : controller.status === 'unreachable'
                          ? 'secondary'
                          : controller.status === 'error'
                          ? 'destructive'
                          : 'secondary'
                      }
                      className="text-xs"
                    >
                      {controller.status === 'unreachable' && '⚠️ '}
                      {controller.status === 'connecting' && '⏳ '}
                      {controller.status === 'error' && '❌ '}
                      {controller.status === 'connected' && '✓ '}
                      {controller.status}
                    </Badge>
                  </div>
                  <p className="text-xs font-mono truncate" title={controller.url}>
                    {controller.url}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {controller.interval}ms interval
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {controller.status === 'unreachable' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => retryController(controller.url)}
                    >
                      Retry
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectController(controller.url)}
                  >
                    Disconnect
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Graph Layout Controls Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Graph Layout</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulationParams}
          >
            Reset
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Charge Strength */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <Label htmlFor="charge-slider" className="text-xs">
                Charge Strength
              </Label>
              <span className="text-xs text-muted-foreground">
                {simulationParams.charge}
              </span>
            </div>
            <Slider
              id="charge-slider"
              min={-300}
              max={-50}
              step={10}
              value={[simulationParams.charge]}
              onValueChange={(value) => updateSimulationParams({ charge: value[0] })}
            />
            <p className="text-xs text-muted-foreground">
              Controls node repulsion
            </p>
          </div>

          {/* Link Distance */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <Label htmlFor="link-slider" className="text-xs">
                Link Distance
              </Label>
              <span className="text-xs text-muted-foreground">
                {simulationParams.linkDistance}
              </span>
            </div>
            <Slider
              id="link-slider"
              min={30}
              max={200}
              step={10}
              value={[simulationParams.linkDistance]}
              onValueChange={(value) => updateSimulationParams({ linkDistance: value[0] })}
            />
            <p className="text-xs text-muted-foreground">
              Distance between connected nodes
            </p>
          </div>

          {/* Center Gravity */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between">
              <Label htmlFor="gravity-slider" className="text-xs">
                Center Gravity
              </Label>
              <span className="text-xs text-muted-foreground">
                {simulationParams.centerGravity.toFixed(2)}
              </span>
            </div>
            <Slider
              id="gravity-slider"
              min={0}
              max={1}
              step={0.05}
              value={[simulationParams.centerGravity]}
              onValueChange={(value) => updateSimulationParams({ centerGravity: value[0] })}
            />
            <p className="text-xs text-muted-foreground">
              Pull toward center
            </p>
          </div>
        </div>
      </div>

      <Separator />

      {/* Filter Controls Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Node Filters</h3>

        <div className="flex flex-col gap-3">
          {/* Show Controllers */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-controllers"
              checked={filters.showControllers}
              onCheckedChange={(checked) =>
                toggleFilter('controller', checked as boolean)
              }
            />
            <Label
              htmlFor="filter-controllers"
              className="text-xs cursor-pointer flex items-center gap-2"
            >
              <div className="size-3 rounded-full bg-green-500" />
              Show Controllers
            </Label>
          </div>

          {/* Show Switches */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-switches"
              checked={filters.showSwitches}
              onCheckedChange={(checked) =>
                toggleFilter('switch', checked as boolean)
              }
            />
            <Label
              htmlFor="filter-switches"
              className="text-xs cursor-pointer flex items-center gap-2"
            >
              <div className="size-3 rounded-full bg-blue-500" />
              Show Switches
            </Label>
          </div>

          {/* Show Hosts */}
          <div className="flex items-center gap-2">
            <Checkbox
              id="filter-hosts"
              checked={filters.showHosts}
              onCheckedChange={(checked) =>
                toggleFilter('host', checked as boolean)
              }
            />
            <Label
              htmlFor="filter-hosts"
              className="text-xs cursor-pointer flex items-center gap-2"
            >
              <div className="size-3 rounded-full bg-purple-500" />
              Show Hosts
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}
