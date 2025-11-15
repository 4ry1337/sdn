import z from "zod"
import axios, { AxiosError } from "axios"
import { Node } from "@/entities/graph"
import { floodlight_fetch_controller_uptime } from './uptime'
import { floodlight_fetch_controller_memory } from './memory'
import { floodlight_fetch_controller_summary } from './summary'
import { floodlight_fetch_controller_tables } from './tables'
import { floodlight_fetch_controller_version } from './version'

export async function floodlight_fetch_controller( url: string ): Promise<Node> {
  try {
    const [
      memory_response,
      summary_response,
      tables_response,
      uptime_response,
      version_response
    ] = await Promise.all( [
      await floodlight_fetch_controller_memory( url ),
      await floodlight_fetch_controller_summary( url ),
      await floodlight_fetch_controller_tables( url ),
      await floodlight_fetch_controller_uptime( url ),
      await floodlight_fetch_controller_version( url ),
    ] )

    return {
      id: url,
      type: 'controller',
      label: 'Floodlight Controller',
      metrics: {
        uptime_msec: uptime_response.systemUptimeMsec,
        memory: {
          total: memory_response.total,
          free: memory_response.free
        },
        tables: tables_response
      },
      metadata: {
        name: version_response.name,
        switches: summary_response[ '# Switches' ],
        hosts: summary_response[ '# hosts' ],
        inter_switch_links: summary_response[ '# inter-switch links' ],
        quarantine_ports: summary_response[ '# quarantine ports' ],
        version: version_response.version,
      }
    }
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid controller data from Floodlight: ${error.message}` )
    }
    if ( axios.isAxiosError( error ) ) {
      const axiosError = error as AxiosError
      if ( axiosError.code === 'ECONNABORTED' ) throw new Error( `Floodlight request timed out after 5s. Controller may be unresponsive at ${url}` )
      if ( axiosError.code === 'ERR_NETWORK' || !axiosError.response ) throw new Error( `Cannot connect to Floodlight controller at ${url}. Check if the controller is running and the URL is correct.` )
      if ( axiosError.response ) {
        const status = axiosError.response.status
        const endpoint = axiosError.config?.url || 'unknown endpoint'
        if ( status === 404 ) throw new Error( `Floodlight endpoint not found: ${endpoint}. This may be an unsupported Floodlight version.` )
        if ( status === 503 ) throw new Error( `Floodlight controller is unavailable (503). Service may be starting up or overloaded.` )
        if ( status >= 500 ) throw new Error( `Floodlight internal error (${status}) at ${endpoint}. Check controller logs.` )
        throw new Error( `Floodlight API error (${status}): ${axiosError.response.statusText} at ${endpoint}` )
      }
    }
    throw error
  }
}
