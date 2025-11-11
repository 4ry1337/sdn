'use client'

import { Label } from "@/shared/ui/label"
import { SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel } from "@/shared/ui/sidebar"
import { RotateCcwIcon } from "lucide-react"
import { Checkbox } from "@/shared/ui/checkbox"
import { useGraphViewer } from "./context"

export function GraphFilterControls() {
  const { filters } = useGraphViewer()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Filters
      </SidebarGroupLabel>
      <SidebarGroupAction
        onClick={filters.reset}
      >
        <RotateCcwIcon />
        <span className="sr-only">Reset</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 px-2">
            <Checkbox
              id="filter-controllers"
              checked={filters.value.showControllers}
              onCheckedChange={( checked: boolean ) =>
                filters.update( { showControllers: checked } )
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
              checked={filters.value.showSwitches}
              onCheckedChange={( checked: boolean ) =>
                filters.update( { showSwitches: checked } )
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
              checked={filters.value.showHosts}
              onCheckedChange={( checked: boolean ) =>
                filters.update( { showHosts: checked } )
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
  )
}
