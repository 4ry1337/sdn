import z from 'zod'

export const FloodlightSwitchSchema = z.object( {
  inetAddress: z.string(),
  connectedSince: z.number(),
  openFlowVersion: z.string(),
  switchDPID: z.string(),
} )

