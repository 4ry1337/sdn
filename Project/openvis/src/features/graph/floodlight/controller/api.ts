import z from "zod"
import axios, { AxiosError } from "axios"
import { Node } from "@/entities/graph"
import { add_prefix } from "@/shared/lib/utils"

export async function floodlight_fetch_controller( url: string ): Promise<Node> {
  try {
    // Fetch controller data and port statistics in parallel
    // const controller_stats_response = 

    return {
      id: add_prefix( url, 'floodlight-controller' ),
      type: 'controller' as const,
      label: 'Floodlight Controller',
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
