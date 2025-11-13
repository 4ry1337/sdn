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
        Host: {node.label}
      </ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuLabel className="text-xs text-muted-foreground px-2">
        Network Information{!node.metadata && ': Unavailable'}
      </ContextMenuLabel>
      {node.metadata}
      <ContextMenuSeparator />
      <ContextMenuLabel className="text-xs text-muted-foreground px-2">
        Network Metrics{!node.metrics && ': Unavailable'}
      </ContextMenuLabel>
      <pre>
        {node.metrics}
      </pre>
    </ContextMenuGroup >
  )
}
