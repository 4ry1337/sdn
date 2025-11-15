import { Controller } from "@/entities/controller"
import { Badge } from "@/shared/ui/badge"

const STATUS_COLORS = {
  connecting: 'bg-blue-500',
  connected: 'bg-green-500',
  unreachable: 'bg-red-500',
  error: 'bg-orange-500',
  disconnected: 'bg-gray-500'
} as const

const STATUS_LABELS = {
  connecting: 'Connecting',
  connected: 'Connected',
  unreachable: 'Unreachable',
  error: 'Error',
  disconnected: 'Disconnected'
} as const

export const ControllerItem = ( { controller }: { controller: Controller } ) => {
  return (
    <div
      className="flex items-center justify-between gap-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${STATUS_COLORS[controller.status]} ${controller.status === 'connected' ? 'animate-pulse' : ''}`}
            title={STATUS_LABELS[controller.status]}
          />
          <p className="text-xs font-mono truncate flex-1" title={controller.url}>
            {controller.url}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{controller.interval}ms</span>
          <span>•</span>
          <Badge variant="outline" className="text-xs px-1.5 py-0">
            {controller.type}
          </Badge>
          <span>•</span>
          <span className="capitalize">{STATUS_LABELS[controller.status]}</span>
        </div>
      </div>
    </div>
  )
}
