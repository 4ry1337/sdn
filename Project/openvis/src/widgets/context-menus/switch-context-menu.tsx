"use client"

import { D3Node } from "@/features/graph"
import {
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuItem,
  ContextMenuGroup,
  ContextMenuSub,
  ContextMenuSubTrigger,
  ContextMenuSubContent,
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
  return (
    <ContextMenuGroup>
      <ContextMenuLabel>
        Switch: {node.label}
      </ContextMenuLabel>
      <ContextMenuSeparator />
      <ContextMenuLabel className="text-xs text-muted-foreground px-2">
        Network Information{!node.metadata && ': Unavailable'}
      </ContextMenuLabel>
      {node.metadata && (
        <>
          {node.metadata.version && (
            <ContextMenuItem>
              Version: {node.metadata.version}
            </ContextMenuItem>
          )}
          {node.metadata.manufacturer_description && (
            <ContextMenuItem>
              Manufacturer: {node.metadata.manufacturer_description}
            </ContextMenuItem>
          )}
          {node.metadata.hardware_description && (
            <ContextMenuItem>
              Hardware: {node.metadata.hardware_description}
            </ContextMenuItem>
          )}
          {node.metadata.software_description && (
            <ContextMenuItem>
              Software: {node.metadata.software_description}
            </ContextMenuItem>
          )}
          {node.metadata.serial_number && (
            <ContextMenuItem>
              Serial Number: {node.metadata.serial_number}
            </ContextMenuItem>
          )}
          {node.metadata.datapath_description && (
            <ContextMenuItem>
              Datapath: {node.metadata.datapath_description}
            </ContextMenuItem>
          )}
        </>
      )}
      <ContextMenuSeparator />
      <ContextMenuLabel className="text-xs text-muted-foreground px-2">
        Network Metrics{!node.metrics && ': Unavailable'}
      </ContextMenuLabel>
      {node.metrics && (
        <>
          {node.metrics.flow_count !== undefined && (
            <ContextMenuItem>
              Flow Count: {node.metrics.flow_count}
            </ContextMenuItem>
          )}
          {node.metrics.packet_count !== undefined && (
            <ContextMenuItem>
              Packet Count: {node.metrics.packet_count.toLocaleString()}
            </ContextMenuItem>
          )}
          {node.metrics.byte_count !== undefined && (
            <ContextMenuItem>
              Byte Count: {(node.metrics.byte_count / 1024 / 1024).toFixed(2)} MB
            </ContextMenuItem>
          )}
        </>
      )}
      {node.port && node.port.length > 0 && (
        <>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              Ports ({node.port.length})
            </ContextMenuSubTrigger>
            <ContextMenuSubContent>
              {node.port.map((port) => (
                <ContextMenuSub key={port.port_number}>
                  <ContextMenuSubTrigger>
                    Port {port.port_number}
                  </ContextMenuSubTrigger>
                  <ContextMenuSubContent>
                    <ContextMenuLabel className="text-xs text-muted-foreground px-2">
                      Port Metadata
                    </ContextMenuLabel>
                    {port.metadata && (
                      <>
                        <ContextMenuItem>
                          Name: {port.metadata.name}
                        </ContextMenuItem>
                        <ContextMenuItem>
                          MAC: {port.metadata.hardware_address}
                        </ContextMenuItem>
                        <ContextMenuItem>
                          State: {port.metadata.state?.join(', ') || 'None'}
                        </ContextMenuItem>
                        <ContextMenuItem>
                          Speed: {port.metadata.curr_speed} / {port.metadata.max_speed}
                        </ContextMenuItem>
                      </>
                    )}
                    <ContextMenuSeparator />
                    <ContextMenuLabel className="text-xs text-muted-foreground px-2">
                      Port Metrics
                    </ContextMenuLabel>
                    <ContextMenuItem>
                      RX Packets: {port.metrics.receive_packets?.toLocaleString() || 0}
                    </ContextMenuItem>
                    <ContextMenuItem>
                      TX Packets: {port.metrics.transmit_packets?.toLocaleString() || 0}
                    </ContextMenuItem>
                    <ContextMenuItem>
                      RX Bytes: {((port.metrics.receive_bytes || 0) / 1024 / 1024).toFixed(2)} MB
                    </ContextMenuItem>
                    <ContextMenuItem>
                      TX Bytes: {((port.metrics.transmit_bytes || 0) / 1024 / 1024).toFixed(2)} MB
                    </ContextMenuItem>
                    <ContextMenuItem>
                      RX Errors: {port.metrics.receive_errors || 0}
                    </ContextMenuItem>
                    <ContextMenuItem>
                      TX Errors: {port.metrics.transmit_errors || 0}
                    </ContextMenuItem>
                    <ContextMenuItem>
                      RX Dropped: {port.metrics.receive_dropped || 0}
                    </ContextMenuItem>
                    <ContextMenuItem>
                      TX Dropped: {port.metrics.transmit_dropped || 0}
                    </ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuSub>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
        </>
      )}
    </ContextMenuGroup >
  )
}
