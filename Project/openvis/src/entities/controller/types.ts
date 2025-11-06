import z from "zod";
import { ControllerTypeSchema } from "./schema";

export type ControllerType = z.infer<typeof ControllerTypeSchema>
