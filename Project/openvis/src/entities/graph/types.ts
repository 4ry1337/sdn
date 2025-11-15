import z from "zod"
import {
  GraphSchema,
  LinkSchema,
  NodeSchema,
  NodeTypeSchema,
  HostNodeSchema,
  HostMetricsSchema,
  HostMetadataSchema,
  SwitchNodeSchema,
  SwitchMetricsSchema,
  SwitchMetadataSchema,
  ControllerNodeSchema,
  ControllerMetricsSchema,
  ControllerMetadataSchema,
  LinkMetricsSchema,
} from "./schema"

export type NodeType = z.infer<typeof NodeTypeSchema>

export type HostMetrics = z.infer<typeof HostMetricsSchema>
export type HostMetadata = z.infer<typeof HostMetadataSchema>
export type HostNode = z.infer<typeof HostNodeSchema>

export type SwitchMetrics = z.infer<typeof SwitchMetricsSchema>
export type SwitchMetadata = z.infer<typeof SwitchMetadataSchema>
export type SwitchNode = z.infer<typeof SwitchNodeSchema>

export type ControllerMetrics = z.infer<typeof ControllerMetricsSchema>
export type ControllerMetadata = z.infer<typeof ControllerMetadataSchema>
export type ControllerNode = z.infer<typeof ControllerNodeSchema>

export type Node = z.infer<typeof NodeSchema>

export type LinkMetrics = z.infer<typeof LinkMetricsSchema>
export type Link = z.infer<typeof LinkSchema>

export type Graph = z.infer<typeof GraphSchema>
