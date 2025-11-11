'use client'

import { Label } from "@/shared/ui/label"
import { Slider } from "@/shared/ui/slider"
import { SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel } from "@/shared/ui/sidebar"
import { RotateCcwIcon } from "lucide-react"
import { useGraphViewer } from "./context"

export function GraphForceControls() {
  const { params } = useGraphViewer()

  return (
    <SidebarGroup>
      <SidebarGroupLabel>
        Forces
      </SidebarGroupLabel>
      <SidebarGroupAction
        onClick={params.reset}
      >
        <RotateCcwIcon />
        <span className="sr-only">Reset</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 px-2">
            <div className="flex justify-between">
              <Label htmlFor="center-force-slider" className="text-xs">
                Center Force
              </Label>
              <span className="text-xs text-muted-foreground">
                {params.value.centerForce.toFixed( 2 )}
              </span>
            </div>
            <Slider
              id="center-force-slider"
              min={0}
              max={1}
              step={0.01}
              value={[ params.value.centerForce ]}
              onValueChange={( value ) => params.update( { centerForce: value[ 0 ] } )}
            />
          </div>

          <div className="flex flex-col gap-2 px-2">
            <div className="flex justify-between">
              <Label htmlFor="repel-force-slider" className="text-xs">
                Repel Force
              </Label>
              <span className="text-xs text-muted-foreground">
                {params.value.repelForce.toFixed( 2 )}
              </span>
            </div>
            <Slider
              id="repel-force-slider"
              min={0}
              max={20}
              step={0.01}
              value={[ params.value.repelForce ]}
              onValueChange={( value ) => params.update( { repelForce: value[ 0 ] } )}
            />
          </div>

          <div className="flex flex-col gap-2 px-2">
            <div className="flex justify-between">
              <Label htmlFor="link-force-slider" className="text-xs">
                Link Force
              </Label>
              <span className="text-xs text-muted-foreground">
                {params.value.linkForce.toFixed( 2 )}
              </span>
            </div>
            <Slider
              id="link-force-slider"
              min={0}
              max={1}
              step={0.01}
              value={[ params.value.linkForce ]}
              onValueChange={( value ) => params.update( { linkForce: value[ 0 ] } )}
            />
          </div>

          <div className="flex flex-col gap-2 px-2">
            <div className="flex justify-between">
              <Label htmlFor="link-distance-slider" className="text-xs">
                Link Distance
              </Label>
              <span className="text-xs text-muted-foreground">
                {params.value.linkDistance}
              </span>
            </div>
            <Slider
              id="link-distance-slider"
              min={30}
              max={500}
              step={1}
              value={[ params.value.linkDistance ]}
              onValueChange={( value ) => params.update( { linkDistance: value[ 0 ] } )}
            />
          </div>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
