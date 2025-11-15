import axios, { AxiosError } from 'axios'
import z from 'zod'
import { FloodlightSwitchSchema } from './schema'
import { Graph } from '@/entities/graph'
import { add_prefix } from '@/shared/lib/utils'
import { fetch_switch_port_stats } from './port'
import { fetch_switch_port_desc } from './port_desc'
import { floodlight_fetch_switches_aggregate } from './aggregate'
import { floodlight_fetch_switches_desc } from './desc'

export const floodlight_fetch_switches = async ( url: string ): Promise<Graph> => {
  try {
    let switches_response = await axios.get( `${url}/wm/core/controller/switches/json`, { timeout: 5000 } )
    let switches = z.array( FloodlightSwitchSchema ).parse( switches_response.data )

    const switch_data_map = new Map(
      await Promise.all(
        switches.map( async value => {
          const [ port_stats_response, port_desc_response, aggregate_response, desc_response ] = await Promise.all( [
            fetch_switch_port_stats( url, value.switchDPID ),
            fetch_switch_port_desc( url, value.switchDPID ),
            floodlight_fetch_switches_aggregate( url, value.switchDPID ),
            floodlight_fetch_switches_desc( url, value.switchDPID )
          ] )
          return [ value.switchDPID, { port_stats_response, port_desc_response, aggregate_response, desc_response } ] as const
        } )
      )
    )

    return {
      nodes: switches.map( value => {
        const data = switch_data_map.get( value.switchDPID )

        const ports = data?.port_stats_response.map( stat => {
          const desc = data.port_desc_response.port_desc.find( d => d.port_number === stat.port_number )
          return {
            port_number: stat.port_number,
            metrics: {
              receive_packets: stat.receive_packets,
              transmit_packets: stat.transmit_packets,
              receive_bytes: stat.receive_bytes,
              transmit_bytes: stat.transmit_bytes,
              receive_dropped: stat.receive_dropped,
              transmit_dropped: stat.transmit_dropped,
              receive_errors: stat.receive_errors,
              transmit_errors: stat.transmit_errors,
              receive_frame_errors: stat.receive_frame_errors,
              receive_overrun_errors: stat.receive_overrun_errors,
              receive_CRC_errors: stat.receive_CRC_errors,
              collisions: stat.collisions,
              duration_sec: stat.duration_sec,
              duration_nsec: stat.duration_nsec,
            },
            metadata: {
              name: desc?.name,
              hardware_address: desc?.hardware_address,
              config: desc?.config,
              state: desc?.state,
              current_features: desc?.current_features,
              advertised_features: desc?.advertised_features,
              supported_features: desc?.supported_features,
              peer_features: desc?.peer_features,
              curr_speed: desc?.curr_speed,
              max_speed: desc?.max_speed,
            }
          }
        } )

        return {
          id: add_prefix( url, value.switchDPID ),
          type: 'switch' as const,
          label: value.switchDPID,
          metadata: {
            version: data?.aggregate_response.version,
            manufacturer_description: data?.desc_response.manufacturer_description,
            hardware_description: data?.desc_response.hardware_description,
            software_description: data?.desc_response.software_description,
            serial_number: data?.desc_response.serial_number,
            datapath_description: data?.desc_response.datapath_description,
          },
          metrics: {
            flow_count: data?.aggregate_response.flow_count,
            packet_count: data?.aggregate_response.packet_count,
            byte_count: data?.aggregate_response.byte_count,
          },
          port: ports,
        }
      } ),
      links: switches.map( value => {
        const data = switch_data_map.get( value.switchDPID )
        const ports = data?.port_stats_response || []

        const total_tx_bytes = ports.reduce( ( sum, p ) => sum + ( p.transmit_bytes || 0 ), 0 )
        const total_rx_bytes = ports.reduce( ( sum, p ) => sum + ( p.receive_bytes || 0 ), 0 )
        const total_tx_packets = ports.reduce( ( sum, p ) => sum + ( p.transmit_packets || 0 ), 0 )
        const total_rx_packets = ports.reduce( ( sum, p ) => sum + ( p.receive_packets || 0 ), 0 )
        const total_tx_errors = ports.reduce( ( sum, p ) => sum + ( p.transmit_errors || 0 ), 0 )
        const total_rx_errors = ports.reduce( ( sum, p ) => sum + ( p.receive_errors || 0 ), 0 )
        const total_tx_dropped = ports.reduce( ( sum, p ) => sum + ( p.transmit_dropped || 0 ), 0 )
        const total_rx_dropped = ports.reduce( ( sum, p ) => sum + ( p.receive_dropped || 0 ), 0 )

        const avg_duration = ports.length > 0
          ? ports.reduce( ( sum, p ) => sum + ( p.duration_sec || 0 ), 0 ) / ports.length
          : 1
        const tx_bandwidth = avg_duration > 0 ? total_tx_bytes / avg_duration : 0
        const rx_bandwidth = avg_duration > 0 ? total_rx_bytes / avg_duration : 0
        const utilization = ( tx_bandwidth + rx_bandwidth ) / 2

        return {
          source_id: url,
          target_id: add_prefix( url, value.switchDPID ),
          metrics: {
            utilization: utilization,
            transmit_bytes: total_tx_bytes,
            receive_bytes: total_rx_bytes,
            transmit_packets: total_tx_packets,
            receive_packets: total_rx_packets,
            transmit_errors: total_tx_errors,
            receive_errors: total_rx_errors,
            transmit_dropped: total_tx_dropped,
            receive_dropped: total_rx_dropped,
          },
          metadata: {
            link_type: 'controller-switch',
          }
        }
      } )
    }
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid switch request data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Floodlight switch request timed out after 5s. Controller may be unresponsive at ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight controller at ${url}. Check if the controller is running and the URL is correct.` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        const endpoint = axiosError.config?.url || 'unknown endpoint'
        if ( status === 404 ) throw new Error( `Floodlight switch endpoint not found: ${endpoint}. This may be an unsupported Floodlight version.` )
        if ( status === 503 ) throw new Error( `Floodlight switch controller is unavailable (503). Service may be starting up or overloaded.` )
        if ( status >= 500 ) throw new Error( `Floodlight switch internal error (${status}) at ${endpoint}. Check controller logs.` )
        throw new Error( `Floodlight switch API error (${status}): ${axiosError.response.statusText} at ${endpoint}` )
      }
    }
    throw error
  }
}
