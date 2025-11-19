"use client"

import React from "react"
import { useGraph } from "@/features/graph"
import { NetworkEventsTimeline, NetworkEvent, NetworkEventType } from "./network-events-timeline"

export function NetworkEventsTimelineConnected() {
  const { nodes, links, graph } = useGraph()
  const [events, setEvents] = React.useState<NetworkEvent[]>([])

  // Track previous state to detect changes
  const prevNodesRef = React.useRef<Set<string>>(new Set())
  const prevLinksRef = React.useRef<Set<string>>(new Set())
  const prevControllersRef = React.useRef<Set<string>>(new Set())

  React.useEffect(() => {
    const currentNodes = new Set(nodes.map(n => n.id))
    const currentLinks = new Set(links.map(l => `${l.source_id}->${l.target_id}`))
    const currentControllers = new Set(Array.from(graph.controllers.keys()))

    const newEvents: NetworkEvent[] = []

    // Detect new switches
    nodes.forEach(node => {
      if (node.type === 'switch' && !prevNodesRef.current.has(node.id)) {
        newEvents.push({
          id: `${Date.now()}-switch-${node.id}`,
          timestamp: new Date(),
          type: 'switch_added',
          severity: 'info',
          message: `Switch ${node.label} connected to network`,
          metadata: { switch_id: node.id }
        })
      }
    })

    // Detect removed switches
    prevNodesRef.current.forEach(nodeId => {
      if (!currentNodes.has(nodeId) && nodeId.includes('::')) {
        const parts = nodeId.split('::')
        if (parts.length > 1) {
          newEvents.push({
            id: `${Date.now()}-switch-removed-${nodeId}`,
            timestamp: new Date(),
            type: 'switch_removed',
            severity: 'warning',
            message: `Switch ${parts[1]} disconnected from network`,
            metadata: { switch_id: nodeId }
          })
        }
      }
    })

    // Detect new hosts
    nodes.forEach(node => {
      if (node.type === 'host' && !prevNodesRef.current.has(node.id)) {
        newEvents.push({
          id: `${Date.now()}-host-${node.id}`,
          timestamp: new Date(),
          type: 'host_discovered',
          severity: 'info',
          message: `Host ${node.label} discovered on network`,
          metadata: { host_id: node.id, mac: node.metadata?.mac }
        })
      }
    })

    // Detect new links (link up)
    links.forEach(link => {
      const linkKey = `${link.source_id}->${link.target_id}`
      if (!prevLinksRef.current.has(linkKey)) {
        newEvents.push({
          id: `${Date.now()}-link-up-${linkKey}`,
          timestamp: new Date(),
          type: 'link_up',
          severity: 'info',
          message: `Link established between ${link.source_id.split('::')[1] || link.source_id} and ${link.target_id.split('::')[1] || link.target_id}`,
          metadata: { source: link.source_id, target: link.target_id }
        })
      }
    })

    // Detect removed links (link down)
    prevLinksRef.current.forEach(linkKey => {
      if (!currentLinks.has(linkKey)) {
        const [source, target] = linkKey.split('->')
        newEvents.push({
          id: `${Date.now()}-link-down-${linkKey}`,
          timestamp: new Date(),
          type: 'link_down',
          severity: 'error',
          message: `Link down between ${source.split('::')[1] || source} and ${target.split('::')[1] || target}`,
          metadata: { source, target }
        })
      }
    })

    // Detect controller connections
    currentControllers.forEach(url => {
      if (!prevControllersRef.current.has(url)) {
        const controller = graph.controllers.get(url)
        if (controller?.status === 'connected') {
          newEvents.push({
            id: `${Date.now()}-controller-connected-${url}`,
            timestamp: new Date(),
            type: 'controller_connected',
            severity: 'info',
            message: `Connected to controller at ${url}`,
            metadata: { controller_url: url }
          })
        }
      }
    })

    // Detect controller disconnections
    prevControllersRef.current.forEach(url => {
      if (!currentControllers.has(url)) {
        newEvents.push({
          id: `${Date.now()}-controller-disconnected-${url}`,
          timestamp: new Date(),
          type: 'controller_disconnected',
          severity: 'warning',
          message: `Disconnected from controller at ${url}`,
          metadata: { controller_url: url }
        })
      }
    })

    // Detect high link utilization
    links.forEach(link => {
      const utilization = link.metrics?.utilization || 0
      const threshold = 1000000 // 1 MB/s threshold
      if (utilization > threshold) {
        const linkKey = `${link.source_id}->${link.target_id}`
        // Only add event if link existed before (not a new link)
        if (prevLinksRef.current.has(linkKey)) {
          newEvents.push({
            id: `${Date.now()}-high-util-${linkKey}`,
            timestamp: new Date(),
            type: 'high_utilization',
            severity: 'warning',
            message: `High traffic detected on link ${link.source_id.split('::')[1] || link.source_id} → ${link.target_id.split('::')[1] || link.target_id}`,
            metadata: {
              source: link.source_id,
              target: link.target_id,
              utilization: Math.round(utilization)
            }
          })
        }
      }
    })

    // Update refs
    prevNodesRef.current = currentNodes
    prevLinksRef.current = currentLinks
    prevControllersRef.current = currentControllers

    // Add new events to state (keep last 100 events)
    if (newEvents.length > 0) {
      setEvents(prev => [...newEvents, ...prev].slice(0, 100))
    }
  }, [nodes, links, graph.controllers])

  return <NetworkEventsTimeline events={events} />
}
