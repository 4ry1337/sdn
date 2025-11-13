"use client"

import { D3Node } from "@/features/graph"
import {
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuItem,
  ContextMenuGroup,
} from "@/shared/ui/context-menu"

type SwitchContextMenuProps = {
  node: D3Node
}

export const SwitchContextMenu = ( { node }: SwitchContextMenuProps ) => {
  if ( node.type !== 'switch' ) {
    return (
      <ContextMenuGroup>
        <ContextMenuLabel>Invalid Node Type</ContextMenuLabel>
        <ContextMenuItem disabled>Expected switch node</ContextMenuItem>
      </ContextMenuGroup>
    )
  }
  console.log( node.metrics )

  return (
    <ContextMenuGroup>
      <ContextMenuLabel>
        Switch: {node.label}
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
    </ContextMenuGroup >
  )
}
