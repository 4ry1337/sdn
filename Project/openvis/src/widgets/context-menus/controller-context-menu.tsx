"use client"

import { D3Node } from "@/features/graph"
import {
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuItem,
  ContextMenuGroup,
} from "@/shared/ui/context-menu"

type ControllerContextMenuProps = {
  node: D3Node
}

export const ControllerContextMenu = ( { node }: ControllerContextMenuProps ) => {
  if ( node.type !== 'controller' ) {
    return (
      <ContextMenuGroup>
        <ContextMenuLabel>Invalid Node Type</ContextMenuLabel>
        <ContextMenuItem disabled>Expected controller node</ContextMenuItem>
      </ContextMenuGroup>
    )
  }

  return (
    <ContextMenuGroup>
      <ContextMenuLabel>
        Controller: {node.label}
      </ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuLabel className="text-xs text-muted-foreground px-2">
        Network Information{!node.metadata && ': Unavailable'}
      </ContextMenuLabel>
      {node.metadata && (
        <>
          <ContextMenuItem>
            Name: {node.metadata.name}
          </ContextMenuItem>
          <ContextMenuItem>
            Version: {node.metadata.version}
          </ContextMenuItem>
          <ContextMenuItem>
            Switches: {node.metadata.switches}
          </ContextMenuItem>
          <ContextMenuItem>
            Hosts: {node.metadata.hosts}
          </ContextMenuItem>
          <ContextMenuItem>
            Inter-switch Links: {node.metadata.inter_switch_links}
          </ContextMenuItem>
          <ContextMenuItem>
            Quarantine Ports: {node.metadata.quarantine_ports}
          </ContextMenuItem>
        </>
      )}
      <ContextMenuSeparator />
      <ContextMenuLabel className="text-xs text-muted-foreground px-2">
        Network Metrics{!node.metrics && ': Unavailable'}
      </ContextMenuLabel>
      {node.metrics && (
        <>
          <ContextMenuItem>
            Uptime: {Math.floor(node.metrics.uptime_msec / 1000 / 60)} minutes
          </ContextMenuItem>
          <ContextMenuItem>
            Memory Total: {(node.metrics.memory.total / 1024 / 1024).toFixed(2)} MB
          </ContextMenuItem>
          <ContextMenuItem>
            Memory Free: {(node.metrics.memory.free / 1024 / 1024).toFixed(2)} MB
          </ContextMenuItem>
          <ContextMenuItem>
            Memory Used: {((node.metrics.memory.total - node.metrics.memory.free) / 1024 / 1024).toFixed(2)} MB
          </ContextMenuItem>
          <ContextMenuItem>
            Tables: {node.metrics.tables.length}
          </ContextMenuItem>
        </>
      )}
    </ContextMenuGroup >
  )
}
