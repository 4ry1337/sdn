import { Controller } from "@/entities/controller"

export const ControllerItem = ({ controller }: { controller: Controller }) => {
  return (
    <div
      className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card"
    >
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <p className="text-xs font-mono truncate" title={controller.url}>
          {controller.url}
        </p>
        <p className="text-xs text-muted-foreground">
          {controller.interval}ms interval
        </p>
      </div>
    </div>
  )
}
