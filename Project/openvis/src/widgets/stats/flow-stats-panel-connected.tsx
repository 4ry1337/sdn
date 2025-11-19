"use client"

import React from "react"
import { useGraph } from "@/features/graph"
import { FlowStatsPanel } from "./flow-stats-panel"

export function FlowStatsPanelConnected() {
  const { nodes } = useGraph()

  const stats = React.useMemo(() => {
    return nodes
      .filter(node => node.type === 'switch')
      .map(node => ({
        switch_id: node.label || node.id,
        flow_count: node.metrics?.flow_count || 0,
        total_packets: node.metrics?.packet_count || 0,
        total_bytes: node.metrics?.byte_count || 0,
        // Estimate active/idle flows (in a real scenario, this would come from the API)
        active_flows: Math.floor((node.metrics?.flow_count || 0) * 0.7),
        idle_flows: Math.floor((node.metrics?.flow_count || 0) * 0.3),
      }))
  }, [nodes])

  return <FlowStatsPanel stats={stats} />
}
