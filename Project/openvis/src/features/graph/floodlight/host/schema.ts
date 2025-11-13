import z from 'zod'

// http://localhost:8080/wm/device/
export const FloodlightDeviceResponseSchema = z.object( {
  entityClass: z.string(),
  mac: z.array( z.string() ),
  ipv4: z.array( z.ipv4() ),
  ipv6: z.array( z.ipv6() ),
  vlan: z.array( z.string() ),
  attachmentPoint: z.array( z.object( {
    switch: z.string(),
    port: z.string(),
  } ) ),
  lastSeen: z.number(),
} )

