import z from "zod"

export const NodeTypeSchema = z.enum( [ 'controller', 'switch', 'host' ] )

const BaseNodeSchema = z.object( {
  id: z.string(),
  label: z.string(),
} )

export const ControllerNodeSchema = BaseNodeSchema.extend( {
  type: z.literal( 'controller' ),
  metrics: z.undefined().optional(),
  metadata: z.undefined().optional(),
} )

export const SwitchNodeSchema = BaseNodeSchema.extend( {
  type: z.literal( 'switch' ),
  metrics: z.any(),
  metadata: z.undefined().optional(),
} )

export const HostNodeSchema = BaseNodeSchema.extend( {
  type: z.literal( 'host' ),
  metrics: z.undefined().optional(),
  metadata: z.undefined().optional(),
} )

export const NodeSchema = z.discriminatedUnion( 'type', [
  ControllerNodeSchema,
  SwitchNodeSchema,
  HostNodeSchema,
] )

export const LinkSchema = z.object( {
  source_id: z.string(),
  target_id: z.string(),
  metrics: z.undefined().optional(),
  metadata: z.undefined().optional(),
} )

export const GraphSchema = z.object( {
  nodes: z.array( NodeSchema ),
  links: z.array( LinkSchema ),
} )
