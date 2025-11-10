'use client';

import { Label } from "@/shared/ui/label";
import { SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel } from "@/shared/ui/sidebar";
import { RotateCcwIcon } from "lucide-react";
import { useGraph } from "@/features/topology/topology.ui";
import React from "react";
import { storage } from "@/shared/lib/storage";
import { NodeFilters } from "@/features/topology";
import { Checkbox } from "@/shared/ui/checkbox";

export function GraphFilterControls() {
  const { filter } = useGraph();

  React.useEffect(() => {
    const saved_filters = storage.get<NodeFilters>('filters');
    filter.update({ ...saved_filters })
  }, []);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Filters
      </SidebarGroupLabel>
      <SidebarGroupAction
        onClick={filter.reset}
      >
        <RotateCcwIcon />
        <span className="sr-only">Reset</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 px-2">
            <Checkbox
              id="filter-controllers"
              checked={filter.values.showControllers}
              onCheckedChange={(checked: boolean) =>
                filter.update({ showControllers: checked })
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

          <div className="flex gap-2 px-2">
            <Checkbox
              id="filter-switches"
              checked={filter.values.showSwitches}
              onCheckedChange={(checked: boolean) =>
                filter.update({ showSwitches: checked })
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

          <div className="flex gap-2 px-2">
            <Checkbox
              id="filter-hosts"
              checked={filter.values.showHosts}
              onCheckedChange={(checked: boolean) =>
                filter.update({ showHosts: checked })
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
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
