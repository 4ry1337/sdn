import z from "zod"

export const NodeTypeSchema = z.enum( [ 'controller', 'switch', 'host' ] )

export const NodeSchema = z.object( {
  id: z.string(),
  type: NodeTypeSchema,
  label: z.string().optional(),
} )

export const LinkSchema = z.object( {
  source_id: z.string(),
  target_id: z.string(),
} )

export const GraphSchema = z.object( {
  nodes: z.array( NodeSchema ),
  links: z.array( LinkSchema ),
  created_at: z.date(),
  updated_at: z.date().nullable()
} )
