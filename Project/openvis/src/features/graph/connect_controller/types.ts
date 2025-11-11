import z from "zod"
import { ConnectControllerSchema } from "./schema"

export type ConnectControllerFormValues = z.infer<typeof ConnectControllerSchema>
