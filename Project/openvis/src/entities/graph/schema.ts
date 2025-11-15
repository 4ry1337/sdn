import { metadata } from '@/app/layout'
import z from "zod"

export const NodeTypeSchema = z.enum( [ 'controller', 'switch', 'host' ] )

const BaseNodeSchema = z.object( {
  id: z.string(),
  label: z.string(),
} )

export const ControllerMetadataSchema = z.object( {
  name: z.string(),
  switches: z.number(),
  hosts: z.number(),
  inter_switch_links: z.number(),
  quarantine_ports: z.number(),
  version: z.string(),
} )

export const ControllerMetricsSchema = z.object( {
  memory: z.object( {
    total: z.number(),
    free: z.number(),
  } ),
  uptime_msec: z.number(),
  tables: z.array( z.string() )
} )

export const ControllerNodeSchema = BaseNodeSchema.extend( {
  type: z.literal( 'controller' ),
  metrics: ControllerMetricsSchema.optional(),
  metadata: ControllerMetadataSchema.optional(),
} )

export const SwitchMetricsSchema = z.object( {
  flow_count: z.number().optional(),
  packet_count: z.number().optional(),
  byte_count: z.number().optional(),
} )

export const SwitchMetadataSchema = z.object( {
  version: z.string().optional(),
  manufacturer_description: z.string().optional(),
  hardware_description: z.string().optional(),
  software_description: z.string().optional(),
  serial_number: z.string().optional(),
  datapath_description: z.string().optional(),
} )

export const SwitchPortMetadataSchema = z.object( {
  name: z.string(),
  hardware_address: z.string(),
  config: z.array( z.string() ),
  state: z.array( z.string() ),
  current_features: z.array( z.string() ),
  advertised_features: z.array( z.string() ),
  supported_features: z.array( z.string() ),
  peer_features: z.array( z.string() ),
  curr_speed: z.string(),
  max_speed: z.string(),
} )

export const SwitchPortMetricSchema = z.object( {
  receive_packets: z.number(),
  transmit_packets: z.number(),
  receive_bytes: z.number(),
  transmit_bytes: z.number(),
  receive_dropped: z.number(),
  transmit_dropped: z.number(),
  receive_errors: z.number(),
  transmit_errors: z.number(),
  receive_frame_errors: z.number(),
  receive_overrun_errors: z.number(),
  receive_CRC_errors: z.number(),
  collisions: z.number(),
  duration_sec: z.number(),
  duration_nsec: z.number(),
} )

export const SwitchPortSchema = z.object( {
  port_number: z.string().optional(),
  metrics: z.object( {
    receive_packets: z.number().optional(),
    transmit_packets: z.number().optional(),
    receive_bytes: z.number().optional(),
    transmit_bytes: z.number().optional(),
    receive_dropped: z.number().optional(),
    transmit_dropped: z.number().optional(),
    receive_errors: z.number().optional(),
    transmit_errors: z.number().optional(),
    receive_frame_errors: z.number().optional(),
    receive_overrun_errors: z.number().optional(),
    receive_CRC_errors: z.number().optional(),
    collisions: z.number().optional(),
    duration_sec: z.number().optional(),
    duration_nsec: z.number().optional(),
  } ),
  metadata: z.object( {
    name: z.string().optional(),
    hardware_address: z.string().optional(),
    config: z.array( z.string() ).optional(),
    state: z.array( z.string() ).optional(),
    current_features: z.array( z.string() ).optional(),
    advertised_features: z.array( z.string() ).optional(),
    supported_features: z.array( z.string() ).optional(),
    peer_features: z.array( z.string() ).optional(),
    curr_speed: z.string().optional(),
    max_speed: z.string().optional(),
  } )
} )

export const SwitchNodeSchema = BaseNodeSchema.extend( {
  type: z.literal( 'switch' ),
  metrics: SwitchMetricsSchema.optional(),
  metadata: SwitchMetadataSchema.optional(),
  port: z.array( SwitchPortSchema ).optional()
} )

export const HostMetricsSchema = z.object( {
  last_seen: z.number().optional(),
} )

export const HostMetadataSchema = z.object( {
  entity_class: z.string().optional(),
  mac: z.array( z.string() ).optional(),
  ipv4: z.array( z.string() ).optional(),
  ipv6: z.array( z.string() ).optional(),
  vlan: z.array( z.string() ).optional(),
  attachment_point: z.array( z.object( {
    switch: z.string(),
    port: z.string(),
  } ) ).optional(),
} )

export const HostNodeSchema = BaseNodeSchema.extend( {
  type: z.literal( 'host' ),
  metrics: HostMetricsSchema.optional(),
  metadata: HostMetadataSchema.optional(),
} )

export const NodeSchema = z.discriminatedUnion( 'type', [
  ControllerNodeSchema,
  SwitchNodeSchema,
  HostNodeSchema,
] )

export const LinkMetricsSchema = z.object( {
} )

export const LinkMetadataSchema = z.object( {
} )

export const LinkSchema = z.object( {
  source_id: z.string(),
  target_id: z.string(),
  metrics: LinkMetricsSchema.optional(),
  metadata: LinkMetadataSchema.optional(),
} )

export const GraphSchema = z.object( {
  nodes: z.array( NodeSchema ),
  links: z.array( LinkSchema ),
} )
