import z from 'zod'

export const Ofp13_PortStateSchema = z.enum( [ 'LIVE', 'BLOCKED', 'LINK_DOWN' ] )

export const Ofp13_PortConfig = z.enum( [
  'PC_PORT_DOWN', /* Port is administratively down. */
  'PC_NO_RECV', /* Drop all packets received by port. */
  'PC_NO_FWD', /* Drop packets forwarded to port. */
  'PC_NO_PACKET_IN' /* Do not send packet-in msgs for port. */
] )

export const Ofp13_PortFeaturesSchema = z.enum( [
  'PF_10MB_HD', /* 10 Mb half-duplex rate support. */
  'PF_10MB_FD', /* 10 Mb full-duplex rate support. */
  'PF_100MB_HD', /* 100 Mb half-duplex rate support. */
  'PF_100MB_FD', /* 100 Mb full-duplex rate support. */
  'PF_1GB_HD', /* 1 Gb half-duplex rate support. */
  'PF_1GB_FD', /* 1 Gb full-duplex rate support. */
  'PF_10GB_FD', /* 10 Gb full-duplex rate support. */
  'PF_40GB_FD', /* 40 Gb full-duplex rate support. */
  'PF_100GB_FD', /* 100 Gb full-duplex rate support. */
  'PF_1TB_FD', /* 1 Tb full-duplex rate support. */
  'PF_OTHER', /* Other rate, not in the list. */
  'PF_COPPER', /* Copper medium. */
  'PF_FIBER', /* Fiber medium. */
  'PF_AUTONEG', /* Auto-negotiation. */
  'PF_PAUSE', /* Pause. */
  'PF_PAUSE_ASYM' /* Asymmetric pause. */
] )

export const Ofp13_PortSchema = z.object( {
  port_number: z.string(),
  hardware_address: z.string(),
  name: z.string(),
  config: z.array( Ofp13_PortConfig ),
  state: z.array( Ofp13_PortStateSchema ),
  current_features: z.array( Ofp13_PortFeaturesSchema ),
  advertised_features: z.array( Ofp13_PortFeaturesSchema ),
  supported_features: z.array( Ofp13_PortFeaturesSchema ),
  peer_features: z.array( Ofp13_PortFeaturesSchema ),
  curr_speed: z.number(),
  max_speed: z.number(),
} )

export const Ofp13_PortStatsSchema = z.object( {
  port_no: z.string(),
  rx_packets: z.number(), /* Number of received packets. */
  tx_packets: z.number(), /* Number of transmitted packets. */
  rx_bytes: z.number(), /* Number of received bytes. */
  tx_bytes: z.number(), /* Number of transmitted bytes. */
  rx_dropped: z.number(), /* Number of packets dropped by RX. */
  tx_dropped: z.number(), /* Number of packets dropped by TX. */
  rx_errors: z.number(), /* Number of receive errors. This is a super-set
of more specific receive errors and should be
greater than or equal to the sum of all
rx_*_err values. */
  tx_errors: z.number(), /* Number of transmit errors. This is a super-set
of more specific transmit errors and should be
greater than or equal to the sum of all
tx_*_err values (none currently defined.) */
  rx_frame_err: z.number(), /* Number of frame alignment errors. */
  rx_over_err: z.number(), /* Number of packets with RX overrun. */
  rx_crc_err: z.number(), /* Number of CRC errors. */
  collisions: z.number(), /* Number of collisions. */
  duration_sec: z.number(), /* Time port has been alive in seconds. */
  duration_nsec: z.number(), /* Time port has been alive in nanoseconds beyond
duration_sec. */
} )
