"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { Separator } from "@/shared/ui/separator"

interface FlowStats {
  switch_id: string
  flow_count: number
  total_packets: number
  total_bytes: number
  active_flows: number
  idle_flows: number
}

interface FlowStatsPanelProps {
  stats?: FlowStats[]
  className?: string
}

export function FlowStatsPanel({ stats = [], className }: FlowStatsPanelProps) {
  const total_flows = stats.reduce((sum, s) => sum + s.flow_count, 0)
  const total_active = stats.reduce((sum, s) => sum + s.active_flows, 0)
  const total_packets = stats.reduce((sum, s) => sum + s.total_packets, 0)
  const total_bytes = stats.reduce((sum, s) => sum + s.total_bytes, 0)

  const format_bytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const format_number = (num: number): string => {
    if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Flow Table Statistics</CardTitle>
        <CardDescription>Real-time OpenFlow table monitoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No flow statistics available. Connect to an SDN controller to see flow data.
          </div>
        ) : (
          <>
        {/* Global Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Flows</p>
            <p className="text-2xl font-bold">{format_number(total_flows)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Active Flows</p>
            <p className="text-2xl font-bold text-green-500">{format_number(total_active)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Packets</p>
            <p className="text-lg font-semibold">{format_number(total_packets)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Total Bytes</p>
            <p className="text-lg font-semibold">{format_bytes(total_bytes)}</p>
          </div>
        </div>

        <Separator />

        {/* Per-Switch Stats */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">Per-Switch Breakdown</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {stats.map((stat) => (
              <div
                key={stat.switch_id}
                className="p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono">{stat.switch_id}</span>
                  <Badge variant="secondary" className="text-xs">
                    {stat.flow_count} flows
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Active</p>
                    <p className="font-semibold text-green-500">{stat.active_flows}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Idle</p>
                    <p className="font-semibold text-gray-500">{stat.idle_flows}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Packets</p>
                    <p className="font-semibold">{format_number(stat.total_packets)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Utilization Indicator */}
        {stats.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">Flow Table Utilization</p>
              {stats.map((stat) => {
                const capacity = 4000 // Typical TCAM capacity
                const utilization = (stat.flow_count / capacity) * 100
                const color = utilization > 80 ? 'bg-red-500' : utilization > 50 ? 'bg-yellow-500' : 'bg-green-500'

                return (
                  <div key={stat.switch_id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono">{stat.switch_id}</span>
                      <span className="text-muted-foreground">{utilization.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className={`${color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
        </>
        )}
      </CardContent>
    </Card>
  )
}
