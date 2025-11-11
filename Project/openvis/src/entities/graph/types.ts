import z from "zod"
import { GraphSchema, LinkSchema, NodeSchema, NodeTypeSchema } from "./schema"

export type NodeType = z.infer<typeof NodeTypeSchema>

export type Node = z.infer<typeof NodeSchema>

export type Link = z.infer<typeof LinkSchema>

export type Graph = z.infer<typeof GraphSchema>
