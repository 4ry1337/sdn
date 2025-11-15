"use client"

import { D3Link } from "@/features/graph"
import {
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuSub,
} from "@/shared/ui/context-menu"
import { format_bytes, format_rate } from "@/shared/lib/metrics"

type LinkContextMenuProps = {
  link: D3Link
}

export const LinkContextMenu = ( { link }: LinkContextMenuProps ) => {
  const metrics = link.metrics
  const metadata = link.metadata
  const utilization = metrics?.utilization ?? 0

  return (
    <ContextMenuSub>
      <ContextMenuLabel>Link: {metadata?.src_port_name || metadata?.src_port} → {metadata?.dst_port_name || metadata?.dst_port}</ContextMenuLabel>
      <ContextMenuSeparator />
      
      <ContextMenuLabel className="text-xs font-normal text-muted-foreground">
        Bandwidth: {format_rate( utilization )}
      </ContextMenuLabel>
      
      {metrics && (
        <>
          <ContextMenuItem disabled>
            <span className="text-xs">Bandwidth</span>
          </ContextMenuItem>
          <ContextMenuItem disabled className="pl-6">
            <span className="text-xs text-muted-foreground">TX: {format_bytes( metrics.transmit_bytes || 0 )}</span>
          </ContextMenuItem>
          <ContextMenuItem disabled className="pl-6">
            <span className="text-xs text-muted-foreground">RX: {format_bytes( metrics.receive_bytes || 0 )}</span>
          </ContextMenuItem>
          
          <ContextMenuItem disabled>
            <span className="text-xs">Packets</span>
          </ContextMenuItem>
          <ContextMenuItem disabled className="pl-6">
            <span className="text-xs text-muted-foreground">TX: {( metrics.transmit_packets || 0 ).toLocaleString()}</span>
          </ContextMenuItem>
          <ContextMenuItem disabled className="pl-6">
            <span className="text-xs text-muted-foreground">RX: {( metrics.receive_packets || 0 ).toLocaleString()}</span>
          </ContextMenuItem>
          
          <ContextMenuItem disabled>
            <span className="text-xs">Errors</span>
          </ContextMenuItem>
          <ContextMenuItem disabled className="pl-6">
            <span className="text-xs text-muted-foreground">TX: {( metrics.transmit_errors || 0 ).toLocaleString()}</span>
          </ContextMenuItem>
          <ContextMenuItem disabled className="pl-6">
            <span className="text-xs text-muted-foreground">RX: {( metrics.receive_errors || 0 ).toLocaleString()}</span>
          </ContextMenuItem>
          
          <ContextMenuItem disabled>
            <span className="text-xs">Dropped</span>
          </ContextMenuItem>
          <ContextMenuItem disabled className="pl-6">
            <span className="text-xs text-muted-foreground">TX: {( metrics.transmit_dropped || 0 ).toLocaleString()}</span>
          </ContextMenuItem>
          <ContextMenuItem disabled className="pl-6">
            <span className="text-xs text-muted-foreground">RX: {( metrics.receive_dropped || 0 ).toLocaleString()}</span>
          </ContextMenuItem>
          
          {metrics.latency !== undefined && (
            <ContextMenuItem disabled>
              <span className="text-xs">Latency: {metrics.latency}ms</span>
            </ContextMenuItem>
          )}
        </>
      )}
      
      {metadata && (
        <>
          <ContextMenuSeparator />
          <ContextMenuLabel className="text-xs font-normal text-muted-foreground">
            Type: {metadata.link_type || 'unknown'}
          </ContextMenuLabel>
        </>
      )}
    </ContextMenuSub>
  )
}
