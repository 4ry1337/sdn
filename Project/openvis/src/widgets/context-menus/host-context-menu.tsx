"use client"

import { D3Node } from "@/features/graph"
import {
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuItem,
  ContextMenuGroup,
} from "@/shared/ui/context-menu"

type HostContextMenuProps = {
  node: D3Node
}

export const HostContextMenu = ( { node }: HostContextMenuProps ) => {
  if ( node.type !== 'host' ) {
    return (
      <ContextMenuGroup>
        <ContextMenuLabel>Invalid Node Type</ContextMenuLabel>
        <ContextMenuItem disabled>Expected host node</ContextMenuItem>
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
      {node.metadata && (
        <>
          {node.metadata.entity_class && (
            <ContextMenuItem>
              Entity Class: {node.metadata.entity_class}
            </ContextMenuItem>
          )}
          {node.metadata.mac && node.metadata.mac.length > 0 && (
            <ContextMenuItem>
              MAC: {node.metadata.mac.join(', ')}
            </ContextMenuItem>
          )}
          {node.metadata.ipv4 && node.metadata.ipv4.length > 0 && (
            <ContextMenuItem>
              IPv4: {node.metadata.ipv4.join(', ')}
            </ContextMenuItem>
          )}
          {node.metadata.ipv6 && node.metadata.ipv6.length > 0 && (
            <ContextMenuItem>
              IPv6: {node.metadata.ipv6.join(', ')}
            </ContextMenuItem>
          )}
          {node.metadata.vlan && node.metadata.vlan.length > 0 && (
            <ContextMenuItem>
              VLAN: {node.metadata.vlan.join(', ')}
            </ContextMenuItem>
          )}
          {node.metadata.attachment_point && node.metadata.attachment_point.length > 0 && (
            <>
              <ContextMenuSeparator />
              <ContextMenuLabel className="text-xs text-muted-foreground px-2">
                Attachment Points ({node.metadata.attachment_point.length})
              </ContextMenuLabel>
              {node.metadata.attachment_point.map((ap, idx) => (
                <ContextMenuItem key={idx}>
                  {ap.switch} : Port {ap.port}
                </ContextMenuItem>
              ))}
            </>
          )}
        </>
      )}
      <ContextMenuSeparator />
      <ContextMenuLabel className="text-xs text-muted-foreground px-2">
        Network Metrics{!node.metrics && ': Unavailable'}
      </ContextMenuLabel>
      {node.metrics && node.metrics.last_seen !== undefined && (
        <ContextMenuItem>
          Last Seen: {new Date(node.metrics.last_seen).toLocaleString()}
        </ContextMenuItem>
      )}
    </ContextMenuGroup >
  )
}
