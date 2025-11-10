import { Controller } from "@/entities/controller"
import { ControllerItem } from "./item"

export const ControllerList = ({ controllers }: { controllers: Controller[] }) => {
  return (
    <div className="flex flex-col gap-3" >
      <h3 className="text-sm font-semibold">Connected Controllers</h3>
      <div className="flex flex-col gap-2">
        {controllers.length > 0 && controllers.map((controller) => (
          <ControllerItem
            controller={controller}
            key={controller.url}
          />
        ))}
      </div>
    </div >
  )
}
