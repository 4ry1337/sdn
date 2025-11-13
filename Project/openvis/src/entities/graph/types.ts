import z from "zod"
import {
  GraphSchema,
  LinkSchema,
  NodeSchema,
  NodeTypeSchema,
  HostNodeSchema,
  SwitchNodeSchema,
  ControllerNodeSchema,
} from "./schema"

export type NodeType = z.infer<typeof NodeTypeSchema>

// export type HostMetrics = z.infer<typeof HostMetricsSchema>
export type HostNode = z.infer<typeof HostNodeSchema>

// export type SwitchMetrics = z.infer<typeof SwitchMetricsSchema>
export type SwitchNode = z.infer<typeof SwitchNodeSchema>

// export type ControllerMetrics = z.infer<typeof ControllerMetricsSchema>
export type ControllerNode = z.infer<typeof ControllerNodeSchema>

export type Node = z.infer<typeof NodeSchema>

// export type LinkMetrics = z.infer<typeof LinkMetricsSchema>
export type Link = z.infer<typeof LinkSchema>

export type Graph = z.infer<typeof GraphSchema>
