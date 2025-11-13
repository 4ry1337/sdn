import z from "zod"

// http://localhost:8080/wm/device/
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

export const FloodlightPortDescSchema = z.object( {
  portNumber: z.number(),
  hardwareAddress: z.string(),
  name: z.string(),
  config: z.number(),
  state: z.number(),
  currentFeatures: z.number(),
  advertisedFeatures: z.number(),
  supportedFeatures: z.number(),
  peerFeatures: z.number(),
  currentSpeed: z.number().optional(), // in kbps
  maxSpeed: z.number().optional(), // in kbps
} )
