import z from "zod"

export const FloodlightLinkSchema = z.object( {
  'src-switch': z.string(),
  'src-port': z.number(),
  'dst-switch': z.string(),
  'dst-port': z.number(),
  type: z.string(),
  direction: z.string(),
  latency: z.number(),
} )

export const FloodlightSwitchSchema = z.object( {
  inetAddress: z.string(),
  connectedSince: z.number(),
  openFlowVersion: z.string(),
  switchDPID: z.string(),
  dpid: z.string().optional(),
  // "inetAddress": "/192.168.56.104:34806",
  // "connectedSince": 1762432611930,
  // "openFlowVersion": "OF_13",
  // "switchDPID": "00:00:00:00:00:00:00:03"
} )

// http://localhost:8080/wm/device/
// EXAMPLE:
// export const DeviceSchema = z.object({
//   "entityClass": "DefaultEntityClass",
//   "mac": [
//     "8a:79:14:6e:ad:42"
//   ],
//   "ipv4": [],
//   "ipv6": [
//     "fe80::8879:14ff:fe6e:ad42"
//   ],
//   "vlan": [
//     "0x0"
//   ],
//   "attachmentPoint": [
//     {
//       "switch": "00:00:00:00:00:00:00:03",
//       "port": "3"
//     }
//   ],
//   "lastSeen": 1762433634167
// })
export const FloodlightDeviceSchema = z.object( {
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

//http://www.localhost:8080/wm/core/switch/json
export const FloodlightSummerySchema = z.object( {
  // "# Switches": 3,
  // "# inter-switch links": 4,
  // "# quarantine ports": 0,
  // "# hosts": 7
  switches: z.number(),
  inter_switch_links: z.number(),
  quarantine_ports: z.number(),
  hosts: z.number(),
} )

//http://www.localhost:8080/wm/core/memory/json
export const FloodlightMemorySchema = z.object( {
  total: z.number(),
  free: z.number()
} )

//http://www.localhost:8080/wm/core/health/json
export const FloodlightHealthSchema = z.object( {
  healthy: z.boolean(),
} )

//http://www.localhost:8080/wm/core/version/json
export const FloodlightVersionSchema = z.object( {
  name: z.string(),
  version: z.string()
  // "name": "floodlight",
  // "version": "1.2-SNAPSHOT"
} )

// http://www.localhost:8080/wm/core/system/uptime/json
export const FloodlightUptimeSchema = z.object( {
  systemUptimeMsec: z.number()
  // "systemUptimeMsec": 59488755
} )

//http://www.localhost:8080/wm/core/storage/tables/json
export const FloodlightTablesSchema = z.array( z.string() )
// "controller_controller",
// "controller_controllerinterface",
// "controller_switchconfig",
// "controller_forwardingconfig",
// "controller_staticentrytable",
// "controller_topologyconfig",
// "controller_link",
// "controller_firewallrules"
