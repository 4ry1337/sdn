"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card"
import { Badge } from "@/shared/ui/badge"
import { ScrollArea } from "@/shared/ui/scroll-area"

export type NetworkEventType =
  | 'link_up'
  | 'link_down'
  | 'controller_connected'
  | 'controller_disconnected'
  | 'switch_added'
  | 'switch_removed'
  | 'host_discovered'
  | 'flow_added'
  | 'high_utilization'
  | 'packet_drop'

export interface NetworkEvent {
  id: string
  timestamp: Date
  type: NetworkEventType
  severity: 'info' | 'warning' | 'error'
  message: string
  metadata?: Record<string, any>
}

interface NetworkEventsTimelineProps {
  events: NetworkEvent[]
  maxEvents?: number
  className?: string
}

const EVENT_ICONS = {
  link_up: '🔗',
  link_down: '⛓️‍💥',
  controller_connected: '🎛️',
  controller_disconnected: '❌',
  switch_added: '➕',
  switch_removed: '➖',
  host_discovered: '💻',
  flow_added: '📊',
  high_utilization: '⚠️',
  packet_drop: '📉',
} as const

const EVENT_COLORS = {
  info: 'bg-blue-500/10 border-blue-500/50 text-blue-700 dark:text-blue-300',
  warning: 'bg-yellow-500/10 border-yellow-500/50 text-yellow-700 dark:text-yellow-300',
  error: 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-300',
} as const

const SEVERITY_COLORS = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
} as const

export function NetworkEventsTimeline({
  events,
  maxEvents = 50,
  className
}: NetworkEventsTimelineProps) {
  const recent_events = React.useMemo(() => {
    return events.slice(0, maxEvents)
  }, [events, maxEvents])

  const format_time = (date: Date): string => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleTimeString()
  }

  const event_stats = React.useMemo(() => {
    const stats = {
      total: events.length,
      info: 0,
      warning: 0,
      error: 0,
    }
    events.forEach(event => {
      stats[event.severity]++
    })
    return stats
  }, [events])

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base">Network Events</CardTitle>
            <CardDescription>Real-time network event timeline</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {event_stats.total} total
            </Badge>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-xs text-muted-foreground">{event_stats.info}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-xs text-muted-foreground">{event_stats.warning}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-xs text-muted-foreground">{event_stats.error}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {recent_events.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                No events yet
              </div>
            ) : (
              recent_events.map((event, index) => (
                <div
                  key={event.id}
                  className={`relative p-3 rounded-lg border ${EVENT_COLORS[event.severity]} transition-all hover:scale-[1.02]`}
                >
                  {/* Timeline connector */}
                  {index < recent_events.length - 1 && (
                    <div className="absolute left-6 top-12 w-0.5 h-6 bg-border" />
                  )}

                  <div className="flex items-start gap-3">
                    {/* Event icon & severity indicator */}
                    <div className="relative flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full ${SEVERITY_COLORS[event.severity]} flex items-center justify-center text-white text-sm`}>
                        {EVENT_ICONS[event.type]}
                      </div>
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold capitalize">
                          {event.type.replace(/_/g, ' ')}
                        </p>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format_time(event.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs">{event.message}</p>

                      {/* Metadata */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <Badge
                              key={key}
                              variant="outline"
                              className="text-xs px-1.5 py-0"
                            >
                              {key}: {String(value)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
