"use client"

import React from "react"
import { D3Link } from "@/features/graph"

type LinkTooltipProps = {
  link: D3Link | null
  position: { x: number; y: number }
  visible: boolean
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

function formatBandwidth(bps: number): string {
  if (bps === 0) return '0 bps'
  const k = 1000
  const sizes = ['bps', 'Kbps', 'Mbps', 'Gbps']
  const i = Math.floor(Math.log(bps) / Math.log(k))
  return `${(bps / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

export function LinkTooltip({ link, position, visible }: LinkTooltipProps) {
  if (!visible || !link) return null

  const hasMetrics = link.bandwidth_bps !== undefined ||
                     link.utilization !== undefined ||
                     link.latency !== undefined

  if (!hasMetrics) return null

  return (
    <div
      className="fixed pointer-events-none z-50 bg-popover border border-border rounded-lg shadow-lg p-3 text-sm"
      style={{
        left: `${position.x + 15}px`,
        top: `${position.y + 15}px`,
        maxWidth: '300px',
      }}
    >
      <div className="space-y-2">
        <div className="font-semibold text-foreground border-b border-border pb-1">
          Link Metrics
        </div>

        {link.bandwidth_bps !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Bandwidth:</span>
            <span className="font-mono font-medium text-foreground">
              {formatBandwidth(link.bandwidth_bps)}
            </span>
          </div>
        )}

        {link.utilization !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Utilization:</span>
            <span className="font-mono font-medium text-foreground">
              {link.utilization.toFixed(2)}%
            </span>
          </div>
        )}

        {link.latency !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Latency:</span>
            <span className="font-mono font-medium text-foreground">
              {link.latency.toFixed(2)} ms
            </span>
          </div>
        )}

        {link.packet_loss !== undefined && link.packet_loss > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Packet Loss:</span>
            <span className="font-mono font-medium text-destructive">
              {link.packet_loss.toFixed(2)}%
            </span>
          </div>
        )}

        {link.source_port !== undefined && link.target_port !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Ports:</span>
            <span className="font-mono font-medium text-foreground">
              {link.source_port} ↔ {link.target_port}
            </span>
          </div>
        )}

        {link.rx_bytes !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">RX Bytes:</span>
            <span className="font-mono font-medium text-foreground">
              {formatBytes(link.rx_bytes)}
            </span>
          </div>
        )}

        {link.tx_bytes !== undefined && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">TX Bytes:</span>
            <span className="font-mono font-medium text-foreground">
              {formatBytes(link.tx_bytes)}
            </span>
          </div>
        )}

        {link.errors !== undefined && link.errors > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Errors:</span>
            <span className="font-mono font-medium text-destructive">
              {link.errors}
            </span>
          </div>
        )}

        {link.link_type && (
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Type:</span>
            <span className="font-mono text-xs text-foreground">
              {link.link_type}
            </span>
          </div>
        )}
      </div>

      {/* Visual utilization bar */}
      {link.utilization !== undefined && (
        <div className="mt-3 pt-2 border-t border-border">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>Utilization</span>
            <span>{link.utilization.toFixed(1)}%</span>
          </div>
          <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{
                width: `${Math.min(100, link.utilization)}%`,
                backgroundColor:
                  link.utilization < 50
                    ? '#22c55e' // green
                    : link.utilization < 80
                    ? '#eab308' // yellow
                    : '#ef4444', // red
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
