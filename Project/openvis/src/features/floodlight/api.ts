import z from "zod"
import axios, { AxiosError } from "axios"
import { Graph, Link, Node } from "@/entities/graph"
import { floodlight_fetch_switches } from './switch'
import { floodlight_fetch_hosts } from './host'
import { floodlight_fetch_links } from './link'
import { floodlight_fetch_controller } from './controller'

export async function fetch_floodlight_topology( url: string ): Promise<Graph> {
  try {
    // Fetch topology data and port statistics in parallel
    const [ controller_response, switches_response, links_response, devices_response ] = await Promise.all( [
      floodlight_fetch_controller( url ),
      floodlight_fetch_switches( url ),
      floodlight_fetch_links( url ),
      floodlight_fetch_hosts( url )
    ] )

    const nodes: Node[] = [
      controller_response,
      ...switches_response.nodes,
      ...devices_response.nodes
    ]

    const links: Link[] = [
      ...switches_response.links,
      ...links_response.links,
      ...devices_response.links
    ]

    return {
      nodes,
      links,
    }
  } catch ( error ) {
    if ( error instanceof z.ZodError ) {
      throw new Error( `Invalid topology data from Floodlight: ${error.message}` )
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
