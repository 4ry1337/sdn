import z from "zod"
import { NextRequest } from "next/server"
import { fetch_floodlight_topology } from "@/features/floodlight"

const default_interval = 5000
const max_consecutive_errors = 3

const StreamFloodlightTopologyQuerySchema = z.object( {
  url: z.url( 'Invalid controller URL' ),
  i: z.number().nullable()
} )

export async function GET( req: NextRequest ) {
  const search_params = req.nextUrl.searchParams
  const params = {
    url: search_params.get( "url" ),
    i: search_params.get( "i" ) ? Number( search_params.get( "i" ) ) : null
  }

  const validation = StreamFloodlightTopologyQuerySchema.safeParse( params )

  if ( !validation.success ) {
    return new Response(
      JSON.stringify( {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid parameters',
          details: validation.error.issues
        }
      } ),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const { url, i } = validation.data
  const interval = i || default_interval

  const encoder = new TextEncoder()
  const stream = new ReadableStream( {
    async start( controller ) {
      let consecutiveErrors = 0
      let intervalId: NodeJS.Timeout | null = null

      const sendEvent = ( eventType: string, data: unknown ) => {
        const message = `event: ${eventType}\ndata: ${JSON.stringify( data )}\n\n`
        controller.enqueue( encoder.encode( message ) )
      }

      const cleanup = () => {
        if ( intervalId ) {
          clearInterval( intervalId )
          intervalId = null
        }
        controller.close()
      }

      try {
        const initialTopology = await fetch_floodlight_topology( url )
        sendEvent( 'topology', initialTopology )
        consecutiveErrors = 0
      } catch ( error ) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error( "[STREAM] Initial connection failed:", { url, error: errorMessage } )
        sendEvent( 'error', {
          code: 'INITIAL_CONNECTION_FAILED',
          message: errorMessage,
          url
        } )
        cleanup()
        return
      }

      // Start polling
      intervalId = setInterval( async () => {
        try {
          const topology = await fetch_floodlight_topology( url )
          sendEvent( 'topology', topology )
          consecutiveErrors = 0 // Reset on success

        } catch ( error ) {
          consecutiveErrors++
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'

          console.error( `[STREAM] Fetch error (${consecutiveErrors}/${max_consecutive_errors}):`, {
            url,
            error: errorMessage,
            timestamp: new Date().toISOString()
          } )

          // Send error event
          sendEvent( 'error', {
            code: 'FETCH_ERROR',
            message: errorMessage,
            url,
            consecutiveErrors,
            maxErrors: max_consecutive_errors
          } )

          // Close stream after too many consecutive errors
          if ( consecutiveErrors >= max_consecutive_errors ) {
            console.error( "[STREAM] Max consecutive errors reached, closing stream" )
            sendEvent( 'error', {
              code: 'MAX_ERRORS_REACHED',
              message: `Stream closed after ${max_consecutive_errors} consecutive errors`,
              lastError: errorMessage,
              url
            } )
            cleanup()
          }
        }
      }, interval )

      // Cleanup on client disconnect
      req.signal.addEventListener( 'abort', () => {
        console.log( "[STREAM] Client disconnected, cleaning up" )
        cleanup()
      } )
    },
  } )

  return new Response( stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  } )
}
