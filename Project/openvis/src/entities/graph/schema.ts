import z from "zod";

export const NodeTypeSchema = z.enum(['controller', 'switch', 'host'])

export const NodeSchema = z.object({
  id: z.string(),
  type: NodeTypeSchema,
  label: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(), // ✅ Fixed
});

export const LinkSchema = z.object({
  source: z.string(),
  target: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(), // ✅ Fixed
});
