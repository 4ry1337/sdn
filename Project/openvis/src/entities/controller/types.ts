import z from "zod";
import { ControllerSchema, ControllerStatusSchema, ControllerTypeSchema } from "./schema";

export type ControllerType = z.infer<typeof ControllerTypeSchema>
export type ControllerStatus = z.infer<typeof ControllerStatusSchema>

export type Controller = z.infer<typeof ControllerSchema> & {
  eventSource: EventSource | null
}
